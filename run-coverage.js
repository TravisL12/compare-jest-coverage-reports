// coverage-runner.js
const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

const execAsync = promisify(exec);

async function runInDir(command, label, cwd) {
  console.log(`\n--- ${label} ---`);
  const { stdout, stderr } = await execAsync(command, {
    cwd,
    shell: "/bin/bash",
  });
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

async function getFiles(command, cwd) {
  const { stdout } = await execAsync(command, {
    cwd,
    shell: "/bin/bash",
  }); // shell matters here
  const results = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");

  return results;
}

async function getChangedDirs(branchName, cwd) {
  const diffCommand = `git diff --name-only main...${branchName} | grep -vE 'test|styles|json|mock'`;
  const dirs = await getFiles(diffCommand, cwd);

  const findRelatedCommand = `yarn jest --listTests --findRelatedTests ${dirs}`;
  const related = await getFiles(findRelatedCommand, cwd);

  return related;
}

function copyCoverageFile(branchName, fromDir, toDir, isMain = false) {
  const source = path.join(fromDir, "coverage", "coverage-summary.json");
  const destName = isMain
    ? "coverage-summary.json"
    : `coverage-summary_${branchName.replace(/[^\w.-]+/g, "_")}.json`;
  const destination = path.join(toDir, destName);

  if (!fs.existsSync(source))
    throw new Error(`Missing coverage file: ${source}`);
  fs.copyFileSync(source, destination);
}

const runOnBranch = async (branchName, fromDir, toDir) => {
  await runInDir(
    `git checkout ${branchName}`,
    `Checking out branch ${branchName}`,
    fromDir
  );
  await runInDir(`git log -1`, `Latest commit on ${branchName}`, fromDir);
  await runInDir(
    `yarn jest --coverage --changedSince main --coverageReporters="json-summary"`,
    `Running Coverage on ${branchName}`,
    fromDir
  );
  copyCoverageFile(branchName, fromDir, toDir, false);
};

const runOnMain = async (branchName, fromDir, toDir) => {
  await runInDir(`git checkout main`, `Switching to main`, fromDir);
  await runInDir(`git status`, `Status on main`, fromDir);
  const subCommand = await getChangedDirs(branchName, fromDir);
  await runInDir(
    `yarn jest ${subCommand} --coverage --coverageReporters="json-summary"`,
    `Running Coverage on Main`,
    fromDir
  );
  copyCoverageFile(branchName, fromDir, toDir, true);
};

async function runCoverage({ targetDir, branchName, skipMain = false }) {
  const cwd = path.resolve(targetDir);
  const outDir = process.cwd();

  const dirs = await getChangedDirs(branchName, cwd);
  if (dirs.length === 0) throw new Error("No changed directories found.");

  await runOnBranch(branchName, cwd, outDir);

  if (!skipMain) {
    await runOnMain(branchName, cwd, outDir);
  }

  return { success: true, testedDirs: dirs };
}

module.exports = { runCoverage };

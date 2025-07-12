#!/usr/bin/env node

const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

const execAsync = promisify(exec);

// Get arguments
const args = process.argv.slice(2);
const targetDirArg = args[0];
const branchName = args[1];
const skipMain = args[2] === "--skipMain";

if (!targetDirArg || !branchName) {
  console.error(
    "Usage: node git-branch-runner.js <target-directory> <branch-name>"
  );
  process.exit(1);
}

const targetDir = path.resolve(process.cwd(), targetDirArg);
const projectRoot = process.cwd();

if (!fs.existsSync(targetDir)) {
  console.error(`Error: Directory "${targetDir}" does not exist.`);
  process.exit(1);
}

// Helper: Run Git Command
async function runGit(command, label) {
  console.log(`\n--- ${label} ---`);
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: targetDir });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  } catch (err) {
    console.error(`Error running "${command}":\n${err.stderr || err.message}`);
    process.exit(1);
  }
}

// Helper: Copy coverage-summary.json
function copyCoverageFile(branch, isMain = false) {
  const source = path.join(targetDir, "coverage", "coverage-summary.json");
  const destName = isMain
    ? "coverage-summary.json"
    : `coverage-summary_branch.json`;
  const destination = path.join(projectRoot, destName);

  console.log(`\n📁 Copying coverage-summary to: ${destName}`);

  if (!fs.existsSync(source)) {
    console.error(`❌ Coverage file not found at ${source}`);
    process.exit(1);
  }

  fs.copyFileSync(source, destination);
  console.log(`✅ Coverage file copied to ${destName}`);
}

async function getFiles(command) {
  const { stdout } = await execAsync(command, {
    cwd: targetDir,
    shell: "/bin/bash",
  }); // shell matters here
  const results = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");

  return results;
}

// Run sub command
async function getChangedDirs(branchName) {
  try {
    const diffCommand = `git diff --name-only main...${branchName} | grep -vE 'test|styles|json|mock'`;
    const dirs = await getFiles(diffCommand);

    const findRelatedCommand = `yarn jest --listTests --findRelatedTests ${dirs}`;
    const related = await getFiles(findRelatedCommand);

    return related;
  } catch (err) {
    console.error(
      `❌ Failed to get changed directories:\n${err.stderr || err.message}`
    );
    return [];
  }
}

const runOnBranch = async () => {
  // Static Git command on the given branch
  await runGit(
    `git checkout ${branchName}`,
    `Checking out branch ${branchName}`
  );
  await runGit(`git log -1`, `Latest commit on ${branchName}`);
  await runGit(
    `yarn jest --coverage --changedSince main --coverageReporters="json-summary"`,
    `Running Coverage on ${branchName}`
  );
  copyCoverageFile(branchName);
};

const runOnMain = async () => {
  await runGit(`git checkout main`, `Switching to main`);
  await runGit(`git status`, `Status on main`);
  const subCommand = await getChangedDirs(branchName);
  await runGit(
    `yarn jest ${subCommand} --coverage --coverageReporters="json-summary"`,
    `Running Coverage on Main`
  );
  copyCoverageFile(branchName, true);
};

(async () => {
  console.log(`📂 Working in directory: ${targetDir}`);
  console.log(`🔀 Target branch: ${branchName}`);

  await runOnBranch(); // Static Git command on the given branch
  if (!skipMain) {
    await runOnMain(); // Switch to main and run another command
  } else {
    console.log("Main branch coverage skipped");
  }
})();

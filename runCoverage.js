#!/usr/bin/env node

const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");

const execAsync = promisify(exec);

// Get arguments
const [, , targetDirArg, branchName] = process.argv;

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
    : `coverage-summary_${branch.replace(/[^\w.-]+/g, "_")}.json`;
  const destination = path.join(projectRoot, destName);

  console.log(`\n📁 Copying coverage-summary to: ${destName}`);

  if (!fs.existsSync(source)) {
    console.error(`❌ Coverage file not found at ${source}`);
    process.exit(1);
  }

  fs.copyFileSync(source, destination);
  console.log(`✅ Coverage file copied to ${destName}`);
}

(async () => {
  console.log(`📂 Working in directory: ${targetDir}`);
  console.log(`🔀 Target branch: ${branchName}`);

  // Static Git command on the given branch
  await runGit(
    `git checkout ${branchName}`,
    `Checking out branch ${branchName}`
  );
  await runGit(`git log -1`, `Latest commit on ${branchName}`);
  await runGit(
    `yarn jest --coverage --changedSince main --coverageReporters="json-summary"`
  );
  copyCoverageFile(branchName);

  // Switch to main and run another command
  await runGit(`git checkout main`, `Switching to main`);
  await runGit(`git status`, `Status on main`);
  await runGit(
    `yarn jest $(git diff --name-only main...${branchName} | grep -vE 'test|styles|json' | xargs -n1 dirname | sort -u) --coverage --coverageReporters="json-summary"`
  );
  copyCoverageFile(branchName, true);
})();

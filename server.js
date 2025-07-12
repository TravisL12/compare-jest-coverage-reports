// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const { runCoverage } = require("./run-coverage");

const app = express();
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/run-coverage", async (req, res) => {
  const { targetDir, branchName, skipMain = false } = req.body;
  console.log(targetDir, branchName, skipMain, "running??????");
  if (!targetDir || !branchName) {
    return res
      .status(400)
      .json({ error: "Missing required parameters: targetDir and branchName" });
  }

  try {
    await runCoverage({ targetDir, branchName, skipMain });
    res.json({ message: "Coverage run completed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/coverage/:branchName", (req, res) => {
  const { branchName } = req.params;
  const { targetBranch } = req.query;

  // Determine which branch directory to look in
  const branchDir = targetBranch || branchName;
  const sanitizedBranchDir = branchDir.replace(/[^\w.-]+/g, "_");

  let filename;
  if (branchName === "main") {
    filename = "coverage-summary.json";
  } else {
    filename = "coverage-summary_branch.json";
  }

  // Look in the branch-specific directory
  const filePath = path.join(
    process.cwd(),
    "branches",
    sanitizedBranchDir,
    filename
  );

  if (!fs.existsSync(filePath)) {
    return res
      .status(404)
      .json({ error: `Coverage file not found: ${filePath}` });
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const stats = fs.statSync(filePath);
    const coverageData = JSON.parse(fileContent);

    res.json({
      data: coverageData,
      lastModified: stats.mtime.toISOString(),
      filename: filename,
      branchDir: sanitizedBranchDir,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error reading coverage file: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Coverage API server is running on port ${PORT}`);
});

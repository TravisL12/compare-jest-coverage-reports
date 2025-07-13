import { controlsForm } from "./constants.js";

const updateElapsedTimer = (seconds, isComplete = false) => {
  const timerEl = document.getElementById("elapsed-timer");
  if (timerEl) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const timeString = `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
    timerEl.textContent = isComplete
      ? `Completed in ${timeString}`
      : `Elapsed: ${timeString}`;
  }
};

export const fetchCoverage = async () => {
  const dirValue = controlsForm.coverageDir.value;
  const branchValue = controlsForm.branchName.value;

  saveToLocalStorage("directories", dirValue);
  saveToLocalStorage("branches", branchValue);

  // Refresh the select dropdowns
  loadStoredValues();

  // Start timer
  const startTime = Date.now();
  updateElapsedTimer(0);
  const timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    updateElapsedTimer(elapsed);
  }, 1000);

  try {
    const body = JSON.stringify({
      targetDir: dirValue,
      branchName: branchValue,
      skipMain: controlsForm["skip-main"].checked,
    });
    await fetch("/run-coverage", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
    });
    await updateTable();
  } finally {
    // Stop timer
    clearInterval(timerInterval);
    const totalElapsed = Math.floor((Date.now() - startTime) / 1000);
    updateElapsedTimer(totalElapsed, true);
  }
};

export const fetchFile = async (isMain = false) => {
  const branchName = isMain ? "main" : controlsForm.branchName.value || "any";
  const targetBranch = controlsForm.branchName.value || "any";
  const url = `./coverage/${branchName}?targetBranch=${encodeURIComponent(
    targetBranch
  )}`;
  const response = await fetch(url);
  const resp = await response.json();

  // Update last modified display
  if (resp.lastModified) {
    const date = new Date(resp.lastModified);
    const formattedDate = date.toLocaleString();
    const elementId = isMain ? "main-last-modified" : "branch-last-modified";
    const label = isMain ? "Main" : "Branch";
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = `${label} last updated: ${formattedDate}`;
    }
  }

  return resp.data || resp;
};

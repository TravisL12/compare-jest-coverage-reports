const tableEl = document.getElementById("comparison-table");
const controlsForm = document.getElementById("controls-form");

// localStorage functions
const saveToLocalStorage = (key, value) => {
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  if (!existing.includes(value) && value.trim() !== "") {
    existing.unshift(value);
    if (existing.length > 10) existing.pop(); // Keep only last 10 values
    localStorage.setItem(key, JSON.stringify(existing));
  }
};

const loadFromLocalStorage = (key) => {
  return JSON.parse(localStorage.getItem(key) || "[]");
};

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

const populateSelect = (selectId, values) => {
  const select = document.getElementById(selectId);
  // Clear existing options except the first one
  while (select.children.length > 1) {
    select.removeChild(select.lastChild);
  }

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
};

const loadStoredValues = () => {
  const directories = loadFromLocalStorage("directories");
  const branches = loadFromLocalStorage("branches");
  populateSelect("coverageDirSelect", directories);
  populateSelect("branchNameSelect", branches);

  // Auto-populate text fields with the most recent values
  if (directories.length > 0) {
    controlsForm.coverageDir.value = directories[0];
  }
  if (branches.length > 0) {
    controlsForm.branchName.value = branches[0];
  }
};

const fetchCoverage = async () => {
  // Save values to localStorage before submitting
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
    const response = await fetch("/run-coverage", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    console.log(data);
    return data;
  } finally {
    // Stop timer
    clearInterval(timerInterval);
    const totalElapsed = Math.floor((Date.now() - startTime) / 1000);
    updateElapsedTimer(totalElapsed, true);
  }
};

const params = ["lines", "branches", "functions", "statements"];

const fetchFile = async (isMain = false) => {
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

const isPopulated = (obj) => {
  return params.some((param) => {
    return obj[param].diff !== 0;
  });
};

const compare = (branch, main) => {
  const branchKeys = Object.keys(branch);
  const comparison = branchKeys.reduce((acc, branchKey) => {
    const newFile = {};

    const b = branch[branchKey];
    const m = main[branchKey];

    if (!m || !b) {
      console.log(b, m);
      return acc;
    }

    params.forEach((param) => {
      const branchValue = b[param].pct;
      const mainValue = m[param].pct;
      const diff = parseFloat((branchValue - mainValue).toFixed(4));
      newFile[param] = { pct: branchValue, diff };
    });

    if (
      isPopulated(newFile) &&
      acc[branchKey] === undefined &&
      branchKey !== "total"
    ) {
      acc[branchKey] = newFile;
    }

    return acc;
  }, {});

  return comparison;
};

const populateTable = (comparison) => {
  const threshold = parseFloat(controlsForm.threshold.value);
  const headerRow = document.createElement("tr");
  const fileHeader = document.createElement("th");
  fileHeader.textContent = "File Name";
  headerRow.appendChild(fileHeader);

  params.forEach((param) => {
    const header = document.createElement("th");
    header.textContent = param.charAt(0).toUpperCase() + param.slice(1);
    headerRow.appendChild(header);
  });

  tableEl.appendChild(headerRow);
  const createRow = (file, data) => {
    const row = document.createElement("tr");
    const fileCell = document.createElement("td");
    fileCell.textContent = file.replace(/^.*\/packages\//, "");
    row.appendChild(fileCell);

    params.forEach((param) => {
      const cell = document.createElement("td");
      cell.innerHTML = `<p>${data[param].pct}%</p><small>(${data[param].diff})</small>`;
      cell.classList.toggle(
        "failing",
        parseFloat(data[param].diff) < threshold
      );
      row.appendChild(cell);
    });

    return row;
  };

  Object.keys(comparison).forEach((file) => {
    const row = createRow(file, comparison[file]);
    tableEl.appendChild(row);
  });
};

const checkThreshold = () => {
  const threshold = parseFloat(controlsForm.threshold.value);
  const rows = tableEl.getElementsByTagName("tr");

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    for (let j = 1; j < cells.length; j++) {
      const el = cells[j].querySelector("small");
      const value = Number(el.textContent.replace(/[()]/g, ""));
      el.classList.toggle("failing", value < threshold);
    }
  }
};

controlsForm.threshold.addEventListener("input", checkThreshold);
controlsForm["update-compare"].addEventListener("click", async () => {
  await fetchCoverage();
});

// Add event listeners for select dropdowns
document.getElementById("coverageDirSelect").addEventListener("change", (e) => {
  if (e.target.value) {
    controlsForm.coverageDir.value = e.target.value;
  }
});

document.getElementById("branchNameSelect").addEventListener("change", (e) => {
  if (e.target.value) {
    controlsForm.branchName.value = e.target.value;
  }
});

const init = async () => {
  // Load stored values on page load
  loadStoredValues();
  console.log(controlsForm.branchName.value, "controlsForm.branchName.value");
  const branchCoverage = await fetchFile();
  const mainCoverage = await fetchFile(true);
  const [branch, main] = await Promise.all([branchCoverage, mainCoverage]);
  const data = compare(branch, main);
  populateTable(data);
};

init();

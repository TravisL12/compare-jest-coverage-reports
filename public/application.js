import {
  branchNameSelect,
  controlsForm,
  coverageDirSelect,
  tableEl,
  TEST_CATEGORIES,
} from "./constants.js";
import { fetchFile, fetchCoverage } from "./fetchUtils.js";
import { loadStoredValues } from "./localStorageUtils.js";

const isPopulated = (obj) => {
  return TEST_CATEGORIES.some((param) => {
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
      console.log(branchKey, { branch: b, main: m }, "missing data!");
      return acc;
    }

    TEST_CATEGORIES.forEach((param) => {
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

  TEST_CATEGORIES.forEach((param) => {
    const header = document.createElement("th");
    header.textContent = param.charAt(0).toUpperCase() + param.slice(1);
    headerRow.appendChild(header);
  });

  tableEl.innerHTML = "";
  tableEl.appendChild(headerRow);
  const createRow = (file, data) => {
    const row = document.createElement("tr");
    const fileCell = document.createElement("td");
    fileCell.textContent = file.replace(/^.*\/packages\//, ""); // trims name down
    // fileCell.textContent = file.split("/").slice(-5).join("/"); // only shows last 3 path items
    row.appendChild(fileCell);

    TEST_CATEGORIES.forEach((param) => {
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

const setupListeners = () => {
  controlsForm.threshold.addEventListener("input", checkThreshold);
  controlsForm["update-compare"].addEventListener("click", async () => {
    await fetchCoverage();
    updateTable();
  });

  coverageDirSelect.addEventListener("change", (e) => {
    if (e.target.value) {
      controlsForm.coverageDir.value = e.target.value;
    }
  });

  branchNameSelect.addEventListener("change", (e) => {
    if (e.target.value) {
      controlsForm.branchName.value = e.target.value;
    }
  });
};

const updateTable = async () => {
  const branchCoverage = await fetchFile();
  const mainCoverage = await fetchFile(true);
  const [branch, main] = await Promise.all([branchCoverage, mainCoverage]);
  const data = compare(branch, main);
  populateTable(data);
};

export const init = async () => {
  setupListeners();
  loadStoredValues(controlsForm);
  await updateTable();
};

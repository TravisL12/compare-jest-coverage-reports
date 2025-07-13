import { controlsForm } from "./constants.js";

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

export const saveToLocalStorage = (key, value) => {
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

export const loadStoredValues = () => {
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

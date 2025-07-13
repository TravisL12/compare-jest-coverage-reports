import { controlsForm } from "./constants.js";

const populateSelect = (selectId, values, selected) => {
  const select = document.getElementById(selectId);
  // Clear existing options except the first one
  while (select.children.length > 1) {
    select.removeChild(select.lastChild);
  }

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = value === selected;
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

  // Auto-populate text fields with the most recent values
  if (directories.length > 0) {
    const selected = directories[0];
    populateSelect("coverageDirSelect", directories, selected);
    controlsForm.coverageDir.value = selected;
  }
  if (branches.length > 0) {
    const selected = branches[0];
    populateSelect("branchNameSelect", branches, selected);
    controlsForm.branchName.value = selected;
  }
};

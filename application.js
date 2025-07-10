const tableEl = document.getElementById("comparison-table");

const fetchCoverage = async (filePath) => {
  const response = await fetch(filePath);
  const data = await response.json();
  return data;
};

const params = ["branches", "functions", "lines", "statements"];

const app = async () => {
  const branchCoverage = await fetchCoverage("./coverage-summary_branch.json");
  const mainCoverage = await fetchCoverage("./coverage-summary.json");
  const [branch, main] = await Promise.all([branchCoverage, mainCoverage]);
  const data = compare(branch, main);
  populateTable(data);
};

const isPopulated = (obj) => {
  return params.some((param) => {
    return obj[param] < 0;
  });
};

const compare = (branch, main) => {
  const branchKeys = Object.keys(branch);
  const comparison = branchKeys.reduce((acc, branchKey) => {
    const newFile = {};

    const b = branch[branchKey];
    const m = main[branchKey];
    params.forEach((param) => {
      const branchValue = b[param].pct;
      const mainValue = m[param].pct;
      const diff = parseFloat((mainValue - branchValue).toFixed(4));
      newFile[param] = diff;
    });

    if (isPopulated(newFile) && acc[branchKey] === undefined) {
      acc[branchKey] = newFile;
    }

    return acc;
  }, {});

  return comparison;
};

const populateTable = (comparison) => {
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
      cell.textContent = data[param];
      row.appendChild(cell);
    });

    return row;
  };

  Object.keys(comparison).forEach((file) => {
    const row = createRow(file, comparison[file]);
    tableEl.appendChild(row);
  });
  checkThreshold();
};

const thresholdInput = document.getElementById("threshold");

const checkThreshold = () => {
  const threshold = parseFloat(thresholdInput.value);
  const rows = tableEl.getElementsByTagName("tr");

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    for (let j = 1; j < cells.length; j++) {
      const value = parseFloat(cells[j].textContent);
      cells[j].classList.toggle("failing", value < threshold);
    }
  }
};

thresholdInput.addEventListener("input", checkThreshold);

app();

'use strict';

// --- DOM Elements ---
const table = document.querySelector('table');
const tableHead = table ? table.querySelector('thead') : null;
const tableBody = table ? table.querySelector('tbody') : null;

// --- State Variables ---
let sortColumnIndex = -1;
let sortDirection = 'ASC';
let selectedRow = null;

// --- Notification Function (Simple Example) ---
function showNotification(message, type) {
  const existingNotification = document.querySelector(
    '[data-qa="notification"]',
  );

  if (existingNotification) {
    existingNotification.remove();
  }

  const notificationDiv = document.createElement('div');

  notificationDiv.className = `notification ${type}`;
  notificationDiv.dataset.qa = 'notification';
  notificationDiv.textContent = message;
  notificationDiv.style.position = 'fixed';
  notificationDiv.style.top = '10px';
  notificationDiv.style.right = '10px';
  notificationDiv.style.padding = '15px';
  notificationDiv.style.border = '1px solid black';
  notificationDiv.style.borderRadius = '5px';
  notificationDiv.style.zIndex = '1000';

  notificationDiv.style.backgroundColor =
    type === 'success' ? '#d4edda' : '#f8d7da';
  notificationDiv.style.color = type === 'success' ? '#155724' : '#721c24';

  notificationDiv.style.borderColor =
    type === 'success' ? '#c3e6cb' : '#f5c6cb';
  document.body.appendChild(notificationDiv);

  setTimeout(() => {
    notificationDiv.remove();
  }, 3000);
}

// --- Form Creation ---
function createEmployeeForm() {
  const form = document.createElement('form');

  form.className = 'new-employee-form';

  const fields = [
    { label: 'Name:', name: 'name', type: 'text' },
    { label: 'Position:', name: 'position', type: 'text' },
    { label: 'Age:', name: 'age', type: 'number' },
    { label: 'Salary:', name: 'salary', type: 'number' },
  ];

  const officeOptions = [
    'Tokyo',
    'Singapore',
    'London',
    'New York',
    'Edinburgh',
    'San Francisco',
  ];

  fields.forEach((fieldData) => {
    const label = document.createElement('label');

    label.textContent = fieldData.label + ' ';

    const input = document.createElement('input');

    input.type = fieldData.type;
    input.name = fieldData.name;
    input.dataset.qa = fieldData.name;

    if (fieldData.type === 'number') {
      input.min = '0';

      if (fieldData.name === 'age') {
        input.min = '18';
        input.max = '90';
      }
    }
    label.appendChild(input);
    form.appendChild(label);
  });

  const officeLabel = document.createElement('label');

  officeLabel.textContent = 'Office: ';

  const officeSelect = document.createElement('select');

  officeSelect.name = 'office';
  officeSelect.dataset.qa = 'office';

  officeOptions.forEach((optionText) => {
    const option = document.createElement('option');

    option.value = optionText;
    option.textContent = optionText;
    officeSelect.appendChild(option);
  });

  officeLabel.appendChild(officeSelect);
  form.appendChild(officeLabel);

  const submitButton = document.createElement('button');

  submitButton.type = 'submit';
  submitButton.textContent = 'Save to table';
  form.appendChild(submitButton);

  form.addEventListener('submit', handleFormSubmit);
  document.body.appendChild(form);
}

// --- Add Row to Table ---
function addEmployeeToTable(employeeData) {
  if (!tableBody) {
    return;
  }

  const newRow = document.createElement('tr');
  const cellOrder = ['name', 'position', 'office', 'age', 'salary'];

  cellOrder.forEach((key) => {
    const cell = document.createElement('td');
    let value = employeeData[key];

    if (key === 'salary') {
      const salaryNumber = Number(value);

      if (!isNaN(salaryNumber)) {
        value = `$${salaryNumber.toLocaleString('en-US')}`;
      } else {
        value = '$' + value;
      }
    }
    cell.textContent = value;
    newRow.appendChild(cell);
  });

  newRow.addEventListener('click', handleRowClick);
  tableBody.appendChild(newRow);
}

// --- Form Submit Handler ---
function handleFormSubmit(evt) {
  // Changed parameter name
  evt.preventDefault();

  const form = evt.target;
  const formData = new FormData(form);
  const employee = {};
  let isValid = true;
  let errorMessage = '';

  for (const [key, value] of formData.entries()) {
    if (!value && value !== 0) {
      isValid = false;

      const fieldName = key.charAt(0).toUpperCase() + key.slice(1);

      errorMessage = `${fieldName} field is required.`;
      break;
    }
    employee[key] = typeof value === 'string' ? value.trim() : value;
  }

  if (isValid) {
    if (employee.name.length < 4) {
      isValid = false;
      errorMessage = 'Name must be at least 4 characters long.';
    }

    const ageNumber = Number(employee.age);

    if (isNaN(ageNumber) || ageNumber < 18 || ageNumber > 90) {
      isValid = false;
      errorMessage = 'Age must be a number between 18 and 90.';
    }

    const salaryNumber = Number(employee.salary);

    if (isNaN(salaryNumber) || salaryNumber < 0) {
      isValid = false;
      errorMessage = 'Salary must be a positive number.';
    } else {
      employee.salary = salaryNumber;
    }
  }

  if (isValid) {
    addEmployeeToTable(employee);
    showNotification('Employee added successfully!', 'success');
    form.reset();
  } else {
    showNotification(errorMessage, 'error');
  }
}

// --- Row Selection Handler ---
function handleRowClick(evt) {
  // Changed parameter name
  const clickedRow = evt.currentTarget;

  if (selectedRow && selectedRow !== clickedRow) {
    selectedRow.classList.remove('active');
  }

  clickedRow.classList.toggle('active');

  if (clickedRow.classList.contains('active')) {
    selectedRow = clickedRow;
  } else {
    selectedRow = null;
  }
}

// --- Sorting Handler ---
function handleSortClick(evt) {
  // Changed parameter name
  const clickedHeader = evt.target;

  if (
    clickedHeader.tagName !== 'TH' ||
    !tableBody ||
    !tableHead ||
    !tableHead.contains(clickedHeader)
  ) {
    return;
  }

  const columnIndex = clickedHeader.cellIndex;
  let newDirection = 'ASC';

  if (columnIndex === sortColumnIndex) {
    newDirection = sortDirection === 'ASC' ? 'DESC' : 'ASC';
  } else {
    newDirection = 'ASC';
  }

  sortColumnIndex = columnIndex;
  sortDirection = newDirection;

  sortTable(columnIndex, sortDirection);
}

// --- Sorting Function ---
function sortTable(columnIndex, direction) {
  if (!tableBody) {
    return;
  }

  const rowsArray = Array.from(tableBody.rows);

  const compareRows = (rowA, rowB) => {
    const cellA = rowA.cells[columnIndex]?.textContent.trim() || '';
    const cellB = rowB.cells[columnIndex]?.textContent.trim() || '';
    let valA = cellA;
    let valB = cellB;
    const isNumericColumn = columnIndex === 3 || columnIndex === 4;

    if (isNumericColumn) {
      // Removed unnecessary escape for $
      const cleanValA = cellA.replace(/[$,]/g, '');
      const cleanValB = cellB.replace(/[$,]/g, '');

      valA = parseFloat(cleanValA);
      valB = parseFloat(cleanValB);

      if (isNaN(valA)) {
        valA = direction === 'ASC' ? Infinity : -Infinity;
      }

      if (isNaN(valB)) {
        valB = direction === 'ASC' ? Infinity : -Infinity;
      }
    }

    if (valA < valB) {
      return direction === 'ASC' ? -1 : 1;
    }

    if (valA > valB) {
      return direction === 'ASC' ? 1 : -1;
    }

    return 0;
  };

  rowsArray.sort(compareRows);
  rowsArray.forEach((row) => tableBody.appendChild(row));
}

// --- Initial Setup ---
createEmployeeForm();

if (table) {
  if (tableHead) {
    tableHead.addEventListener('click', handleSortClick);
  }

  if (tableBody) {
    Array.from(tableBody.rows).forEach((row) => {
      row.addEventListener('click', handleRowClick);
    });
  }
}

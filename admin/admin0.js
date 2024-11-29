// admin0.js
const STUDENTS_KEY = "students";
const BOOKS_KEY = "books";
let students = [];
let isNotFoundMessageShown = false; // Флаг для отслеживания показа сообщения

// Настройка axios для глобального использования
axios.defaults.baseURL = "http://localhost:3000"; // Базовый URL вашего Flask API
axios.defaults.headers.common["Content-Type"] = "application/json";

function edit() {
  window.location.href = "admin.html";
}

function exit() {
  window.location.href = "../index.html";
}

async function fetchBooks(query = "") {
  try {
    const token = localStorage.getItem("token"); // Получаем токен из localStorage
    const response = await axios.get("/api/books", {
      params: { query },
      headers: {
        Authorization: `Bearer ${token}`, // Добавляем заголовок авторизации
      },
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка при загрузке книг:", error);
    return [];
  }
}

async function fetchStudents(query = "") {
  try {
    const token = localStorage.getItem("token"); // Получите токен из локального хранилища
    const response = await axios.get("/api/students", {
      params: { query },
      headers: {
        Authorization: `Bearer ${token}`, // Передача токена в заголовке
      },
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка при загрузке студентов:", error);
    return [];
  }
}

function displayBooks(books) {
  const oldTable = document.getElementById("bookTable");
  if (oldTable) {
    oldTable.remove();
  }

  const adminPanel = document.getElementById("adminPanel");
  const table = document.createElement("table");
  table.id = "bookTable";
  adminPanel.appendChild(table);

  const headerRow = table.insertRow();
  const headers = ["Название", "Автор", "Количество", "Электронная версия", "Местоположение"];
  headers.forEach((headerText) => {
    const header = headerRow.insertCell();
    header.textContent = headerText;
  });

  if (!books || books.length === 0) {
    updateControlsMargin(false);

    // Отображаем сообщение, если книг нет
    displayMessage("Книги не найдены"); // Вызываем функцию для отображения сообщения
    return;
  }


  books.forEach((book) => {
      if (!Array.isArray(book)) {
        console.error("Invalid book data:", book);
        return; // Пропускаем некорректные данные
      }
    const row = table.insertRow();


    const titleCell = row.insertCell();
    titleCell.textContent = book[0] || ""; // Название

    const authorCell = row.insertCell();
    authorCell.textContent = book[1] || ""; // Автор

    const quantityCell = row.insertCell();
    const quantity = book[2];
    quantityCell.textContent = quantity !== null && quantity !== undefined ? quantity : ""; // Количество, обработка null и undefined
    updateCellColor(quantityCell, quantity); 


    const linkCell = row.insertCell();
    const linkValue = book[3];

    if (linkValue) {
      const linkElement = document.createElement("a");
      linkElement.href = linkValue;
      linkElement.target = "_blank"; 

      const tooltipText = document.createElement("span");
      tooltipText.classList.add("tooltiptext");
      tooltipText.textContent = "Открыть ссылку в новой вкладке"; 

      const bookIcon = document.createElement("ion-icon");
      bookIcon.name = "book"; 
      bookIcon.style.fontSize = "24px";
      bookIcon.style.color = "#8000ff";
      linkElement.appendChild(bookIcon);

      const tooltipContainer = document.createElement("div");
      tooltipContainer.classList.add("tooltip-container");
      tooltipContainer.appendChild(linkElement);
      tooltipContainer.appendChild(tooltipText);
      linkCell.appendChild(tooltipContainer);
    } else {
      linkCell.textContent = "Отсутствует";
      linkCell.style.color = "gray";
    }

    const locationCell = row.insertCell();
    locationCell.textContent = book[4] || "Неизвестно"; // Местоположение, обработка null/undefined
});
    

  const controls = document.getElementById("controls");
  adminPanel.insertBefore(table, controls);
  updateControlsMargin(true);
}

function updateCellColor(cell, value) {
    const numValue = parseInt(value, 10);

    if (isNaN(numValue)) {
        cell.style.color = "black";
        return;
    }

    if (numValue > 0) {
        cell.style.color = "rgb(102, 191, 102)";
    } else if (numValue === 0) {
        cell.style.color = "red";
    } else {
        cell.style.color = "blue"; 
    }
}
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "updateBookList") {
    displayBooks(event.data.books); // Обновляем список книг
  }
});

async function updateBookTable() {
  const books = await fetchBooks();
  displayBooks(books);
}

window.addEventListener("message", (event) => {
  console.log("Message from:", event.origin, event.data);
  if (event.data.type === "updateBookQuantity") {
    updateBookTable(); // Обновляем таблицу
  }
});

async function searchBook() {
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  const books = await fetchBooks(query);
  displayBooks(books);
}

async function searchStudent() {
  const query = document
    .getElementById("searchInput1")
    .value.trim()
    .toLowerCase();
  const students = await fetchStudents(query);
  displayStudents(students);
}

function displayStudents(students) {
  if (students.length === 0) {
    return;
  }

  const adminPanel = document.getElementById("adminPanel");
  const studentsTable = document.createElement("table");
  studentsTable.id = "studentsTable";
  adminPanel.appendChild(studentsTable);

  const headerRow = studentsTable.insertRow();
  const headers = ["Фото", "ФИО", "Группа", "Действия"];
  headers.forEach((headerText) => {
    const headerCell = headerRow.insertCell();
    headerCell.textContent = headerText;
  });

  students.forEach((student) => {
    const row = studentsTable.insertRow();
    const fioCell = row.insertCell();
    fioCell.textContent = student.ФИО;

    const groupCell = row.insertCell();
    groupCell.textContent = student.Группа;

    const actionsCell = row.insertCell();
    const openHistoryButton = document.createElement("button");
    openHistoryButton.textContent = "Открыть";
    openHistoryButton.style.backgroundColor = "#87a8ff";
    openHistoryButton.style.color = "white";
    openHistoryButton.style.border = "none";
    openHistoryButton.style.padding = "12px 20px";
    openHistoryButton.style.borderRadius = "10px";
    openHistoryButton.style.width = "137px";
    openHistoryButton.style.cursor = "pointer";

    actionsCell.appendChild(openHistoryButton);
    actionsCell.style.textAlign = "center";
    openHistoryButton.addEventListener("click", () => {
      goToPersonalCabinet(student);
    });
  });

  const oldTable = document.getElementById("studentsTable");
  if (oldTable) {
    oldTable.remove();
  }

  const controls = document.getElementById("controls");
  adminPanel.insertBefore(studentsTable, controls);
  updateControlsMargin(true);
}

function displayMessage(messageText, formId = null) {
  clearPreviousResults();

  const adminPanel = document.getElementById("adminPanel");

  // Создаем контейнер для сообщения
  const messageContainer = document.createElement("div");
  messageContainer.id = "notFoundMessageContainer";
  messageContainer.style.display = "flex";
  messageContainer.style.justifyContent = "center";
  messageContainer.style.alignItems = "center";
  messageContainer.style.position = "absolute";
  messageContainer.style.top = "50%";
  messageContainer.style.left = "50%";
  messageContainer.style.transform = "translate(-50%, -50%)";
  messageContainer.style.textAlign = "center";

  // Создаем текстовое сообщение
  const message = document.createElement("p");
  message.textContent = messageText;
  message.style.margin = "0";
  message.style.fontSize = "18px";
  message.style.color = "#333";

  // Вставляем сообщение в контейнер
  messageContainer.appendChild(message);
  adminPanel.appendChild(messageContainer);

  isNotFoundMessageShown = true;
}

function clearPreviousResults() {
  // Удаляем таблицу книг
  const bookTable = document.getElementById("bookTable");
  if (bookTable) {
    bookTable.remove();
  }

  // Удаляем таблицу студентов
  const studentsTable = document.getElementById("studentsTable");
  if (studentsTable) {
    studentsTable.remove();
  }

  const messageContainer = document.getElementById("notFoundMessageContainer");
  if (messageContainer) {
    messageContainer.remove();
  }
}

function updateControlsMargin(isDataExist) {
  const controls = document.getElementById("controls");
  if (isDataExist) {
    controls.style.marginTop = "20px";
  } else {
    controls.style.marginTop = "200px";
  }
}
function updateCellColor(cell, value) {
  const numValue = parseInt(value, 10); // Парсим в число

  if (isNaN(numValue)) { // Проверяем на NaN
    cell.style.color = "black"; // Или другой цвет по умолчанию
    return; // Выходим из функции, если NaN
  }

  if (numValue > 0) {
    cell.style.color = "rgb(102, 191, 102)";
  } else if (numValue === 0) {
    cell.style.color = "red";
  } else { // Добавлено условие для отрицательных чисел (если нужно)
    cell.style.color = "blue"; // Или другой цвет для отрицательных значений
  }
}
function goToPersonalCabinet(student) {
  const studentId = student.id; //  Именно id
  window.location.href = `../user/personalCabinet.html?fio=${encodeURIComponent(
    student.ФИО
  )}&group=${encodeURIComponent(student.Группа)}&id=${encodeURIComponent(
    studentId
  )}`;
}
function handleSearchFormSubmit(formId, inputId, searchFunction) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);

  if (!form || !input) {
    console.error(`Form or input not found: ${formId}, ${inputId}`);
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // Отключаем стандартное поведение формы
    searchFunction(); // Вызываем переданную функцию поиска
  });

  input.addEventListener("input", () => {
    if (!input.value.trim()) {
      searchFunction(); // Обновляем таблицу при очистке поля поиска
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await updateBookTable(); // Загружаем книги с сервера и отображаем их
  handleSearchFormSubmit("searchForm", "searchInput", searchBook); // Для поиска книг
  handleSearchFormSubmit("searchStudentForm", "searchInput1", searchStudent); // Для поиска студентов
  document.getElementById("edit-book").addEventListener("click", edit);
});

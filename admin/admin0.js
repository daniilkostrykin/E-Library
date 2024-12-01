// admin0.js
const STUDENTS_KEY = "students";
const BOOKS_KEY = "books";
let students = [];
let isNotFoundMessageShown = false; // Флаг для отслеживания показа сообщения

// Настройка axios для глобального использования
axios.defaults.baseURL = "http://localhost:3000"; // Базовый URL вашего Flask API
axios.defaults.headers.common["Content-Type"] = "application/json";

document.addEventListener("DOMContentLoaded", async () => {
   //displayStudents(await fetchStudents()); // Отображаем студентов
  // await updateBookTable(); // Загружаем книги с сервера и отображаем их
  handleSearchFormSubmit("searchForm", "searchInput", searchBook); // Для поиска книг
  handleSearchFormSubmit("searchStudentForm", "searchInput1", searchStudent); // Для поиска студентов
  
  const bookSearchInput = document.getElementById("searchInput");
  const studentSearchInput = document.getElementById("searchInput1");
  const bookSearchButton = document.getElementById("bookSearchButton");
  const studentSearchButton = document.getElementById("studentSearchButton");

  bookSearchInput.addEventListener("input", () => {
    bookSearchButton.value = bookSearchInput.value.trim() ? "Найти" : "Показать книги";
  });

  studentSearchInput.addEventListener("input", () => {
    studentSearchButton.value = studentSearchInput.value.trim() ? "Найти" : "Показать студентов";
  });
 
  document.getElementById("edit-book").addEventListener("click", edit);
});

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
  const headers = [
    "Название",
    "Автор",
    "Количество",
    "Электронная версия",
    "Местоположение",
  ];
  headers.forEach((headerText) => {
    const header = headerRow.insertCell();
    header.textContent = headerText;
  });

  if (!books || books.length === 0) {
    updateControlsMargin(false);

    // Отображаем сообщение, если книг нет
    displayMessage("Книга не найдена"); // Вызываем функцию для отображения сообщения
    return;
  }

  books.forEach((book) => {
    if (!Array.isArray(book)) {
      console.error("Invalid book data:", book);
      return; // Пропускаем некорректные данные
    }
    const row = table.insertRow();

    const titleCell = row.insertCell();
    titleCell.textContent = book[1] || ""; // Название

    const authorCell = row.insertCell();
    authorCell.textContent = book[2] || ""; // Автор

    const quantityCell = row.insertCell();
    const quantity = book[3];
    quantityCell.textContent =
      quantity !== null && quantity !== undefined ? quantity : ""; // Количество, обработка null и undefined
    updateCellColor(quantityCell, quantity);

    const linkCell = row.insertCell();
    const linkValue = book[4];

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
  clearPreviousResults();
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  if (query !== "") {
    // Если поле поиска НЕ пустое (содержит текст)
    const books = await fetchBooks(query);
    displayBooks(books);
  } // Иначе (поле поиска пустое или содержит только пробелы) - ничего не делаем

  // Обновляем margin в зависимости от наличия данных
  const bookTable = document.getElementById("bookTable");
  updateControlsMargin(bookTable !== null);
}
async function searchStudent() {
  clearPreviousResults();
  const query = document
    .getElementById("searchInput1")
    .value.trim()
    .toLowerCase();
  if (query !== "") {
    const students = await fetchStudents(query);
    displayStudents(students);
  }
    // Обновляем margin в зависимости от наличия данных
    const studentsTable = document.getElementById("studentsTable");
    updateControlsMargin(studentsTable !== null); 
}

function displayStudents(students) {
  const oldTable = document.getElementById("studentsTable");
  if (oldTable) {
    oldTable.remove();
  }

  const adminPanel = document.getElementById("adminPanel");
  const studentsTable = document.createElement("table");
  studentsTable.id = "studentsTable";
  adminPanel.appendChild(studentsTable);
  studentsTable.style.width = "80%"; // Устанавливаем ширину таблицы 80%
  studentsTable.style.margin = "0 auto"; // Центрируем таблицу
  const headerRow = studentsTable.insertRow();
  const headers = ["ФИО", "Группа", "Действия"];
  headers.forEach((headerText) => {
    const headerCell = headerRow.insertCell();
    headerCell.textContent = headerText;
  });

  if (!students || students.length === 0) {
    updateControlsMargin(false);

    // Отображаем сообщение, если книг нет
    displayMessage("Студент не найден"); // Вызываем функцию для отображения сообщения
    return;
  }

  students.forEach((student) => {
    if (!Array.isArray(student)) {
      console.error("Invalid student data:", student);
      return; // Пропускаем некорректные данные
    }
    const row = studentsTable.insertRow();

    const fioCell = row.insertCell();
    fioCell.textContent = student[1] || "";

    const groupCell = row.insertCell();
    groupCell.textContent = student[2] || "";

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

  const controls = document.getElementById("controls");
  adminPanel.insertBefore(studentsTable, controls);
  updateControlsMargin(true);
}

function displayMessage(messageText, formId = null) {
  clearPreviousResults();
  updateControlsMargin(false);
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
    controls.style.marginTop = "400px";
  }
}
function updateCellColor(cell, value) {
  const numValue = parseInt(value, 10); // Парсим в число

  if (isNaN(numValue)) {
    // Проверяем на NaN
    cell.style.color = "black"; // Или другой цвет по умолчанию
    return; // Выходим из функции, если NaN
  }

  if (numValue > 0) {
    cell.style.color = "rgb(102, 191, 102)";
  } else if (numValue === 0) {
    cell.style.color = "red";
  } else {
    // Добавлено условие для отрицательных чисел (если нужно)
    cell.style.color = "blue"; // Или другой цвет для отрицательных значений
  }
}
function goToPersonalCabinet(student) {
  const studentId = student[0];
  const fio = student[1];
  const group = student[2];

  // Добавляем ФИО и группу в URL
  window.location.href = `../user/personalCabinet.html?fio=${encodeURIComponent(
    fio
  )}&group=${encodeURIComponent(group)}&id=${encodeURIComponent(studentId)}`;
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
document
  .getElementById("searchForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault(); // Предотвращаем стандартное поведение формы (перезагрузку страницы)

    const query = document
      .getElementById("searchInput")
      .value.trim()
      .toLowerCase();
    const books = await fetchBooks(query); // Выполняем запрос с учётом query
    displayBooks(books);

    // Обновляем margin
    const bookTable = document.getElementById("bookTable");
    updateControlsMargin(bookTable !== null);
  });

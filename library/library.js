//librarian.js
const STUDENTS_KEY = "students";
const BOOKS_KEY = "books";
let students = [];
let isNotFoundMessageShown = false; // Флаг для отслеживания показа сообщения
axios.defaults.baseURL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  await updateBookTable(); // Загружаем книги с сервера и отображаем их

  handleSearchFormSubmit("searchForm", "searchInput", searchBook); // Для поиска книг
  const bookSearchInput = document.getElementById("searchInput");
  const bookSearchButton = document.querySelector(".find");

  bookSearchInput.addEventListener("input", () => {
    bookSearchButton.value = bookSearchInput.value.trim()
      ? "Найти"
      : "Показать книги";
  });
  bookSearchButton.addEventListener("click", () => {
    searchBook();
  });
});

function back() {
  window.history.back();
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

     });

  const controls = document.getElementById("controls");
  adminPanel.insertBefore(table, controls);
  updateControlsMargin(true);
}


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

  // Удаляем сообщение "не найдено"
  const notFoundMessageContainer = document.getElementById(
    "notFoundMessageContainer"
  );
  if (notFoundMessageContainer) {
    notFoundMessageContainer.remove();
  }

  isNotFoundMessageShown = false;
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
function updateControlsMargin(hasData) {
  const controls = document.getElementById("controls");
  controls.style.marginTop = hasData ? "20px" : "400px";
}
function updateCellColor(cell, value) {
  const numValue = parseInt(value, 10);
  if (numValue > 0) {
    cell.style.color = "rgb(102, 191, 102)"; // Светлый пастельный зеленый
  } else if (numValue === 0) {
    cell.style.color = "red";
  }
}
function goToPersonalCabinet(student, index) {
  // !!!! ДОБАВЛЕН  index
  const fio = student.ФИО;

  const group = student.Группа;

  window.location.href = `../user/personalCabinet.html?fio=${encodeURIComponent(
    fio
  )}&group=${encodeURIComponent(group)}&id=${encodeURIComponent(index)}`;
  // Правильный  путь  и  использование  id
}
async function fetchBooks(query = "") {
  try {
    const token = localStorage.getItem("token"); // Получаем токен из localStorage

    const response = await axios.get("/api/books", {
      params: { query },
      headers: {
        Authorization: `Bearer ${token}`, // Добавляем токен в заголовок
      },
    });
    return response.data;
  } catch (error) {
    // Обработка ошибок, если сервер вернет ошибку, даже с токеном
    console.error("Ошибка при получении книг:", error);

    if (error.response && error.response.status === 401) {
      showToast("Сессия истекла. Пожалуйста, войдите снова.");

      logout(); //  Вызываем функцию logout для перенаправления
    }

    throw error;
  }
}
async function updateBookTable() {
  const books = await fetchBooks();
  displayBooks(books);
}

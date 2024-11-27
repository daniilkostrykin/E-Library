//librarian.js
const STUDENTS_KEY = "students";
const BOOKS_KEY = "books";
let students = [];
let isNotFoundMessageShown = false; // Флаг для отслеживания показа сообщения

function back() {
  window.history.back();
}
function displayBooks(books) {
  //Удаляем предыдущую таблицу книг, если она существует
  const oldTable = document.getElementById("bookTable"); //находим предыдущую
  if (oldTable) {
    oldTable.remove(); //если существует, удаляем её перед добавлением новой
  }
  const adminPanel = document.getElementById("adminPanel");

  //Создаем таблицу динамически
  const table = document.createElement("table");
  table.id = "bookTable";
  adminPanel.appendChild(table);

  // Заголовок таблицы
  const headerRow = table.insertRow();
  const headers = ["Название", "Автор", "Количество", "Электронная версия"];
  headers.forEach((headerText) => {
    const header = headerRow.insertCell();
    header.textContent = headerText;
  });

  // Проверяем есть ли данные, чтобы не выводить пустую таблицу

  if (!books || books.length === 0) {
    updateControlsMargin(false);
    return; // Прерываем функцию, если нет данных
  }

  books.forEach((book) => {
    const row = table.insertRow();
    Object.entries(book)
      .filter(([key]) => key !== "Местоположение") // Фильтруем ключи
      .forEach(([key, value]) => {
        const cell = row.insertCell();
        if (key === "Электронная версия") {
          if (value) {
            const linkElement = document.createElement("a");
            linkElement.href = value;
            linkElement.target = "_blank"; // Открыть в новой вкладке

            // Создаем элемент подсказки
            const tooltipText = document.createElement("span");
            tooltipText.classList.add("tooltiptext");
            tooltipText.textContent = "Открыть ссылку в новой вкладке"; // Текст подсказки

            // Создаем иконку книги
            const bookIcon = document.createElement("ion-icon");
            bookIcon.name = "book"; // Устанавливаем имя иконки книги
            bookIcon.style.fontSize = "24px";
            bookIcon.style.color = "#8000ff";
            // Добавляем иконку в ссылку
            linkElement.appendChild(bookIcon);

            // Оборачиваем ссылку и подсказку в контейнер для стилизации
            const tooltipContainer = document.createElement("div");
            tooltipContainer.classList.add("tooltip-container");
            tooltipContainer.appendChild(linkElement);
            tooltipContainer.appendChild(tooltipText);

            // Добавляем контейнер в ячейку таблицы
            cell.appendChild(tooltipContainer);
          } else {
            cell.textContent = "Отсутствует";
            cell.style.color = "gray"; // Серый цвет текста
          }
        } else if (key === "Количество") {
          cell.textContent = value;
          // Установить цвет текста в зависимости от значения
          updateCellColor(cell, value);
        } else {
          cell.textContent = value;
        }
      });
  });

  const controls = document.getElementById("controls");
  adminPanel.insertBefore(table, controls);
  updateControlsMargin(true);
}

async function searchBook() {
  clearPreviousResults();
  const books = await fetchBooks();
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  // Если поле ввода пустое, отображаем все книги
  if (!query) {
    displayBooks(books);
    updateControlsMargin(true);
    return;
  }

  const filteredBooks = books.filter(
    (book) =>
      book.Название.toLowerCase().includes(query) ||
      book.Автор.toLowerCase().includes(query)
  );

  if (filteredBooks.length) {
    displayBooks(filteredBooks);
    updateControlsMargin(true); // Устанавливаем маленький отступ
  } else {
    displayMessage(
      `Книга с названием или автором "${query}" не найдена`,
      "searchForm"
    );
    updateControlsMargin(false);
  }
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

function handleSearchFormSubmit(formId, inputId) {
  const form = document.getElementById(formId);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById(inputId);

    if (formId === "searchForm") {
      searchBook();
    }
  });
}
function updateControlsMargin(hasData) {
  const controls = document.getElementById("controls");
  controls.style.marginTop = hasData ? "40px" : "400px";
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
async function fetchBooks() {
  try {
    const response = await axios.get("/books"); // Получение всех книг
    return response.data; // Предполагается, что сервер возвращает JSON с массивом книг
  } catch (error) {
    console.error("Ошибка при загрузке книг:", error);
    return [];
  }
}
async function updateBookTable() {
  const books = await fetchBooks();
  displayBooks(books);
}
document.addEventListener("DOMContentLoaded", async () => {
  await updateBookTable(); // Загружаем книги с сервера и отображаем их

  handleSearchFormSubmit("searchForm", "searchInput"); // Для  книг
  displayBooks(books);
});

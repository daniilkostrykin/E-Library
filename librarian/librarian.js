//librarian.js
const STUDENTS_KEY = "students";
const BOOKS_KEY = "books";
let students = [];
let isNotFoundMessageShown = false; // Флаг для отслеживания показа сообщения

function logout() {
  window.location.href = "../index.html";
}
// Функция для получения списка книг
async function fetchBooks() {
  try {
    const response = await axios.get(`${API_BASE_URL}/books`);
    const books = response.data;
    displayBooks(books); // Отображение книг
  } catch (error) {
    console.error("Ошибка загрузки данных книг:", error);
    displayMessage("Не удалось загрузить книги. Попробуйте позже.");
  }
}

function displayBooks(books, highlightBook = null) {
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

  // Проверяем есть ли данные, чтобы не выводить пустую таблицу

  if (!books || books.length === 0) {
    updateControlsMargin(false);
    return; // Прерываем функцию, если нет данных
  }

  books.forEach((book) => {
    const row = table.insertRow();
    Object.entries(book).forEach(([key, value]) => {
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
      } else if (key === "Местоположение") {
        if (value) {
          // Если значение не пустое
          cell.textContent = value;
        } else {
          cell.textContent = "Неизвестно"; // Или любой другой текст-заполнитель
          cell.style.color = "gray"; // Серый цвет текста
        }
      } else {
        cell.textContent = value;
      }
    });
    if (highlightBook && book.Название === highlightBook) {
      row.classList.add("highlighted-row"); //  Добавляем класс для подсветки
    }
  });
  const controls = document.getElementById("controls");
  adminPanel.insertBefore(table, controls);
  updateControlsMargin(true);
}
async function updateBookTable() {
  const books = await fetchBooks();
  displayBooks(books);
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

async function searchStudent() {
  clearPreviousResults();
  const students = await fetchStudents();
  const query = document
    .getElementById("searchInput1")
    .value.trim()
    .toLowerCase();

  if (!query) {
    displayStudents(students);
    return;
  }

  const filteredStudents = students.filter(
    (student) =>
      student.ФИО.toLowerCase().includes(query) ||
      student.Группа.toLowerCase().includes(query)
  );

  if (filteredStudents.length) {
    displayStudents(filteredStudents);
  } else {
    displayMessage(
      `Студент с ФИО или группой "${query}" не найден`,
      "searchStudentForm"
    );
  }
}
function displayStudents(students) {
  if (students.length === 0) {
    return;
  }
  const adminPanel = document.getElementById("adminPanel");
  const studentsTable = document.createElement("table");
  studentsTable.id = "studentsTable";
  adminPanel.appendChild(studentsTable); // добавляем таблицу

  const headerRow = studentsTable.insertRow();
  const headers = [ "ФИО", "Группа", "Действия"]; // Заголовки таблицы
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

    // здесь будет обработчик открытия истории, пока пустой

    actionsCell.appendChild(openHistoryButton);
    actionsCell.style.textAlign = "center";
    openHistoryButton.addEventListener("click", () => {
      //            const fio = student.ФИО;
      // const group = student.Группа;
      goToPersonalCabinet(student);
    });
    //      actionsCell.appendChild(openHistoryButton);

    // ....
  });

  //Удаляем предыдущую таблицу студентов, если она существует
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
    } else {
      searchStudent();
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
// librarian.js (или admin0.js)
function goToPersonalCabinet(student) {
  const studentId = student.id; //  Именно id
  window.location.href = `../user/personalCabinet.html?fio=${encodeURIComponent(
    student.ФИО
  )}&group=${encodeURIComponent(student.Группа)}&id=${encodeURIComponent(
    studentId
  )}`;
}
document.addEventListener("DOMContentLoaded", async () => {
  await updateBookTable();
  handleSearchFormSubmit("searchForm", "searchInput"); // Для  книг
  handleSearchFormSubmit("searchStudentForm", "searchInput1"); // Для  студентов
  displayBooks(books);
});

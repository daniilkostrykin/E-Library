//admin0.js
const STUDENTS_KEY = "students";
const BOOKS_KEY = "books";
let students = [];
let isNotFoundMessageShown = false; // Флаг для отслеживания показа сообщения

function logout() {
  window.location.href = "../index.html";
}
function displayBooks(filteredBooks) {
    const booksTableContainer = document.getElementById('booksTableContainer');
    booksTableContainer.innerHTML = ''; // Очистка текущего списка
  
    filteredBooks.forEach(book => {
      const bookRow = document.createElement('div');
      bookRow.classList.add('book-row');
  
      bookRow.innerHTML = `
        <span class="book-title">${book.title}</span>
        <span class="book-author-title">${book.author}</span>
        <span class="book-date-title">${book.dueDate}</span>
      `;
  
      booksTableContainer.appendChild(bookRow);
    });
  }

// Обработчик формы поиска
document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Предотвращаем перезагрузку страницы
  
    const searchQuery = document.getElementById('searchInput').value.toLowerCase(); // Получаем введенный запрос
    const filteredBooks = books.filter(book => 
      book.title.toLowerCase().includes(searchQuery) || 
      book.author.toLowerCase().includes(searchQuery) ||
      book.dueDate.includes(searchQuery)
    );
  
    displayBooks(filteredBooks); // Отображаем отфильтрованные книги
  });
  
  // Изначальное отображение всех книг
  displayBooks(books);
function searchBook() {
  clearPreviousResults(); // Удаляем предыдущие результаты
  const studentsTable = document.getElementById("studentsTable");
  if (studentsTable) {
    studentsTable.remove();
  }

  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  const bookTable = document.getElementById("bookTable");

  // Если поле ввода пустое
  if (!query) {
    return;
  }
  // Поиск книг
  const filteredBooks = books.filter(
    (book) =>
      book.Название.toLowerCase().includes(query) ||
      book.Автор.toLowerCase().includes(query)
  );

  // Если найдены книги
  if (filteredBooks.length) {
    displayBooks(filteredBooks);
    updateControlsMargin(true); // Устанавливаем маленький отступ
  } else {
    displayMessage(
      `Книги с названием или автором "${query}" не найдено в системе`,
      "searchForm"
    ); // Передаем formId

    updateControlsMargin(false); // Так как  таблица не отображается

    isNotFoundMessageShown = true;
  }
}

function searchStudent() {
  clearPreviousResults(); // Удаляем предыдущие результаты
  const oldTable = document.getElementById("studentsTable");
  if (oldTable) {
    oldTable.remove();
  } // Проверяем, есть ли студенты
  if (!students || students.length === 0) {
    updateControlsMargin(false);
  }
  // Очищаем таблицу книг, если она существует
  const bookTable = document.getElementById("bookTable");
  if (bookTable) {
    bookTable.remove();
  }
  if (!students || students.length === 0) {
    updateControlsMargin(false);
  }

  const query = document
    .getElementById("searchInput1")
    .value.toLowerCase()
    .trim();

  // Добавлено:  если запрос пустой, отображаем ВСЕХ студентов.
  if (!query) {
    //  displayStudents(students); // students - это глобальный массив.  Убедитесь что данные студентов добавлены в localStorage в DOMContentLoaded
    updateControlsMargin(false);
    return;
  }

  //  если есть запрос
  const filteredStudents = students.filter((student) => {
    //  students - это глобальный массив

    return (
      student.ФИО.toLowerCase().includes(query) ||
      student.Группа.toLowerCase().includes(query)
    );
  });

  if (filteredStudents.length) {
    displayStudents(filteredStudents);

    updateControlsMargin(true);
  } else {
    displayMessage(
      `Студента с ФИО или группой "${query}" не найден в системе`,
      "searchStudentForm"
    ); // Передаем formId
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
  const headers = ["Фото", "ФИО", "Группа", "Действия"]; // Заголовки таблицы
  headers.forEach((headerText) => {
    const headerCell = headerRow.insertCell();
    headerCell.textContent = headerText;
  });

  students.forEach((student) => {
    const row = studentsTable.insertRow();

    const photoCell = row.insertCell(); // ячейка для фото

    const img = document.createElement("img");
    img.src = student.Фото;
    img.alt = "Фото студента";
    img.style.width = "50px"; // или любой другой нужный вам размер
    img.style.height = "50px";
    photoCell.appendChild(img);
    photoCell.style.textAlign = "center";

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
    // здесь будет обработчик открытия истории, пока пустой

    actionsCell.appendChild(openHistoryButton);
    actionsCell.style.textAlign = "center";
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

function createCancelButton(formId, inputId, submitButton) {
  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Отмена";
  cancelButton.style.backgroundColor = "gray";
  cancelButton.style.color = "white";
  cancelButton.style.padding = "12px 20px";
  cancelButton.style.borderRadius = "10px";
  cancelButton.style.border = "none";
  cancelButton.classList.add("cancel-button"); // Добавляем класс для удобства поиска

  cancelButton.addEventListener("click", (event) => {
    event.preventDefault();
    clearPreviousResults();

    // 1. Очищаем текущую форму
    document.getElementById(inputId).value = "";

    // 2. Удаляем таблицу, связанную с текущей формой
    const tableId = formId === "searchForm" ? "bookTable" : "studentsTable";
    const oldTable = document.getElementById(tableId);
    if (oldTable) {
      oldTable.remove();
      updateControlsMargin(false);
    }

    // 3. Восстанавливаем кнопку "Найти" текущей формы
    submitButton.style.display = "";

    // 4. Удаляем кнопку "Отмена" текущей формы
    cancelButton.remove();

    // 5. Очищаем другую форму и убираем её кнопку "Отмена"
    const otherFormId =
      formId === "searchForm" ? "searchStudentForm" : "searchForm";
    const otherInput = document
      .getElementById(otherFormId)
      .querySelector("input[type='text']");
    const otherCancelButton = document
      .getElementById(otherFormId)
      .querySelector(".cancel-button");
    const otherSubmitButton = document
      .getElementById(otherFormId)
      .querySelector(".find");

    if (otherInput) {
      otherInput.value = "";
    }
    if (otherCancelButton) {
      otherCancelButton.remove();
      if (otherSubmitButton) {
        otherSubmitButton.style.display = "";
      }
    }
  });

  return cancelButton;
}
function handleSearchFormSubmit(formId, inputId) {
  const form = document.getElementById(formId);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const input = document.getElementById(inputId);

    if (input.value.trim() !== "") {
      const submitButton = form.elements[form.elements.length - 1];

      submitButton.style.display = "none";

      const cancelButton = createCancelButton(formId, inputId, submitButton); // Передаем submitButton

      cancelButton.classList.add("cancel-button");

      form.insertBefore(cancelButton, submitButton.nextSibling);

      if (formId === "searchForm") {
        searchBook();
      } else {
        searchStudent();
      }
    }
  }); // конец обработчика submit
}
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomFIO() {
  const lastNames = [
    "Иванов",
    "Петров",
    "Сидоров",
    "Кузнецов",
    "Смирнов",
    "Попов",
    "Лебедев",
    "Козлов",
    "Новиков",
    "Морозов",
  ];

  const firstNames = [
    "Александр",
    "Алексей",
    "Анастасия",
    "Андрей",
    "Анна",
    "Дмитрий",
    "Екатерина",
    "Иван",
    "Кирилл",
    "Мария",
  ];

  const middleNames = [
    "Александрович",
    "Алексеевна",
    "Иванович",
    "Дмитриевна",
    "Петрович",
    "Андреевна",
    "Сергеевич",
    "Викторовна",
    "Николаевич",
    "Владимировна",
  ];

  const lastName = getRandomItem(lastNames);
  const firstName = getRandomItem(firstNames);
  const middleName = getRandomItem(middleNames);

  return `${lastName} ${firstName} ${middleName}`;
}
function updateControlsMargin(hasData) {
  const controls = document.getElementById("controls");
  controls.style.marginTop = hasData ? "40px" : "400px";
}
function updateCellColor(cell, value) {
  const numValue = parseInt(value, 10);
  if (numValue > 0) {
    cell.style.color = "rgb(134, 243, 132)";
  } else if (numValue === 0) {
    cell.style.color = "red";
  }
}
function fillStrorage() {
  // 2. Загружаем студентов из localStorage или создаем новых, если их нет
  students = JSON.parse(localStorage.getItem(STUDENTS_KEY)) || [];

  // ЕСЛИ В localStorage НЕТ СТУДЕНТОВ, СОЗДАЕМ ИХ И СОХРАНЯЕМ
  if (students.length === 0) {
    const groups = [
      "ИБМ-101",
      "ИБМ-102",
      "ИСИТ-201",
      "ИСИТ-202",
      "ИВТ-301",
      "ИВТ-302",
    ];
    const photoPlaceholder = "../assets/img-placeholder.png"; // Убедитесь, что путь правильный
    console.log("Путь к изображению (admin0.js):", photoPlaceholder);

    for (let i = 1; i <= 50; i++) {
      const fullName = getRandomFIO();
      const group = getRandomItem(groups);
      students.push({
        Фото: photoPlaceholder,
        ФИО: fullName,
        Группа: group,
      });
    }
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students)); // Сохраняем студентов в localStorage
  }

  // УДАЛИТЬ, КАК ТОЛЬКО БУДУТ РЕАЛЬНЫЕ ДАННЫЕ:
  let initial_books = [
    {
      Название: "Мастер и Маргарита",
      Автор: "Михаил Булгаков",
      Количество: 5,
      "Электронная версия": "https://example.com/master_margarita",
      Местоположение: "Главная библиотека, зал 1, полка 5",
    },
    {
      Название: "Преступление и наказание",
      Автор: "Фёдор Достоевский",
      Количество: 3,
      "Электронная версия": "https://example.com/prestuplenie_nakazanie",
      Местоположение: "Главная библиотека, зал 2, полка 10",
    },
    {
      Название: "Война и мир",
      Автор: "Лев Толстой",
      Количество: 7,
      "Электронная версия": "https://example.com/voina_mir",
      Местоположение: "Главная библиотека, зал 3, полка 15",
    },
    {
      Название: "Евгений Онегин",
      Автор: "Александр Пушкин",
      Количество: 10,
      "Электронная версия": "", //  Нет электронной версии
      Местоположение: "Главная библиотека, зал 1, полка 20",
    },
    {
      Название: "Мертвые души",
      Автор: "Николай Гоголь",
      Количество: 2,
      "Электронная версия": "https://example.com/mertvye_dushi",
      Местоположение: "Главная библиотека, зал 2, полка 25",
    },
  ];
  localStorage.setItem(BOOKS_KEY, JSON.stringify(initial_books)); // <--- Add this line !!!
}
document.addEventListener("DOMContentLoaded", () => {
  fillStrorage();
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  originalBooks = JSON.parse(JSON.stringify(books));
  handleSearchFormSubmit("searchForm", "searchInput"); // Для  книг
  handleSearchFormSubmit("searchStudentForm", "searchInput1"); // Для  студентов
  document.getElementById("edit-book").addEventListener("click", edit);
});

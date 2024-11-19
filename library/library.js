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
    // добавляем данные только если они есть в localStorage
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

function searchBook() {
  clearPreviousResults(); // Удаляем предыдущие результаты
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  // Если поле ввода пустое, отображаем все книги
  if (!query) {
    displayBooks(books);
    updateControlsMargin(true); // Устанавливаем маленький отступ
    return; // Завершаем функцию
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

    updateControlsMargin(false); // Так как таблица не отображается
  }
}

function searchStudent() {
  clearPreviousResults(); // Удаляем предыдущие результаты
  const students = JSON.parse(localStorage.getItem(STUDENTS_KEY)) || [];
  const query = document
    .getElementById("searchInput1")
    .value.toLowerCase()
    .trim();

  // Если запрос пустой, отображаем всех студентов
  if (!query) {
    displayStudents(students);
    updateControlsMargin(true); // Устанавливаем маленький отступ
    return; // Завершаем функцию
  }

  // Если есть запрос, выполняем фильтрацию
  const filteredStudents = students.filter((student) => {
    return (
      student.ФИО.toLowerCase().includes(query) ||
      student.Группа.toLowerCase().includes(query)
    );
  });

  // Если найдены студенты
  if (filteredStudents.length) {
    displayStudents(filteredStudents);
    updateControlsMargin(true);
  } else {
    displayMessage(
      `Студента с ФИО или группой "${query}" не найден в системе`,
      "searchStudentForm"
    ); // Передаем formId
    updateControlsMargin(false); // Так как таблица не отображается
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

  students.forEach((student, index) => {
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
    openHistoryButton.addEventListener("click", () => {
      //            const fio = student.ФИО;
      // const group = student.Группа;
      goToPersonalCabinet(student, index); //Передаем index
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

  return `${lastName} ${firstName} ${middleName} role:"user"`;
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}
function updateControlsMargin(hasData) {
  const controls = document.getElementById("controls");
  controls.style.marginTop = hasData ? "40px" : "400px";
}
function updateCellColor(cell, value) {
  const numValue = parseInt(value, 10);
  if (numValue > 0) {
    cell.style.color = "rgb(144, 238, 144)";  // Светлый пастельный зеленый
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
function fillStorage() {
 /* // 2. Загружаем студентов из localStorage или создаем новых, если их нет
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
        role: "user",
      });
    }
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students)); // Сохраняем студентов в localStorage
  }*/
  if (!localStorage.getItem(BOOKS_KEY)) {
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
  originalBooks = JSON.parse(localStorage.getItem(BOOKS_KEY));
}
document.addEventListener("DOMContentLoaded", () => {
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  fillStorage();
  handleSearchFormSubmit("searchForm", "searchInput"); // Для  книг
  displayBooks(books);
});

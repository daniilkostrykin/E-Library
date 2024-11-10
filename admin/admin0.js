const STUDENTS_KEY = "students";
const BOOKS_KEY = "books";
let students = [];
function edit() {
  window.location.href = "admin.html";
}
function displayBooks(books) {
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

  //Удаляем предыдущую таблицу книг, если она существует
  const oldTable = document.getElementById("bookTable"); //находим предыдущую
  if (oldTable) {
    oldTable.remove(); //если существует, удаляем её перед добавлением новой
  }

  // Проверяем есть ли данные, чтобы не выводить пустую таблицу

  if (!books || books.length === 0) {
    updateControlsMargin(false);
    return; // Прерываем функцию, если нет данных
  }

  books.forEach((book) => {
    // добавляем данные только если они есть в localStorage
    const row = table.insertRow();
    Object.entries(book).forEach(([key, value]) => {
      const cell = row.insertCell();

      if (key === "Электронная версия") {
        if (value) {
          const linkElement = document.createElement("a");
          linkElement.href = value;
          linkElement.textContent = "Ссылка";
          cell.appendChild(linkElement);
        } else {
          cell.textContent = "Нет";
        }
      } else if (key === "Местоположение") {
        cell.textContent = value;
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
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  const booksTable = document.getElementById("booksTable");

  // Если поле ввода пустое
  if (!query) {
    //  удаляем таблицу, если она есть

    const oldTable = document.getElementById("bookTable");
    if (oldTable) {
      oldTable.remove();
    }
    updateControlsMargin(false); // Вызовите вашу функцию, если необходимо
    return; // ничего не отображаем
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
    alert("Совпадений не найдено!");
    if (booksTable) {
      booksTable.remove(); // Удаляем таблицу, если она существует
    }
    updateControlsMargin(false); // Устанавливаем большой отступ
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

function searchStudent() {
  const oldTable = document.getElementById("studentsTable");
  if (oldTable) {
    oldTable.remove();
  } // Проверяем, есть ли студенты
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
    updateControlsMargin(false); //  Убедитесь, что отступ установлен в 40px
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

  // Добавлено:  отображаем отфильтрованных студентов
  displayStudents(filteredStudents);
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. Загружаем книги из localStorage
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];

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

  localStorage.setItem("books", JSON.stringify(initial_books)); // УДАЛИТЬ ПОСЛЕ ЗАПОЛНЕНИЯ ЧЕРЕЗ ИНТЕРФЕЙС

  document.getElementById("edit-book").addEventListener("click", edit);

  document.getElementById("searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    searchBook();
  });
  document.getElementById("searchForm1").addEventListener("submit", (event) => {
    event.preventDefault();
    searchStudent();
  });
});
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

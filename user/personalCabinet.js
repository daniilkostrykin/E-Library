// personalCabinet.js
const BOOKS_KEY = "books";
const STUDENTS_KEY = "students"; //  Ключ для студентов
const TAKEN_BOOKS_KEY = "takenBooks"; //  Ключ для взятых книг

function goToLibrary() {
  window.location.href = "../library/library.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const account = getLoggedInAccount();

  displayUserInfo(account);

  searchBookSetup(); // Инициализация поиска
});

function displayUserInfo(account) {
  if (account) {
    document.getElementById("user-name").textContent = account.name;
    document.getElementById("user-group").textContent = account.group;

    document.getElementById("user-photo").src = "../assets/dima.jpg";

    const userBooks = loadUserBooks(account.id);

    displayUserBooks(userBooks);
  }
}

function getLoggedInAccount() {
  // Получаем email из localStorage (если есть, значит, залогинен)

  const loggedInEmail = localStorage.getItem("loggedInEmail");

  if (!loggedInEmail) return null;
  // const account = JSON.parse(localStorage.getItem(loggedInEmail));

  const accounts = JSON.parse(localStorage.getItem("accounts")) || [];

  return accounts.find((account) => account.email === loggedInEmail);
}

function loadUserBooks(userId) {
  const takenBooks = JSON.parse(localStorage.getItem(TAKEN_BOOKS_KEY)) || [];

  // Находим задолженности по userId
  const userBookData = takenBooks.find((item) => item.userId === userId);

  return userBookData ? userBookData.books : [];
}

function displayUserBooks(books) {
  const bookList = document.querySelector(".book-list");

  bookList.innerHTML = "";

  if (books.length === 0) {
    const noBooksMessage = document.createElement("p");

    noBooksMessage.textContent = "Нет взятых книг";

    noBooksMessage.style.textAlign = "center";
    noBooksMessage.style.fontSize = "18px";

    noBooksMessage.style.color = "#555";

    bookList.appendChild(noBooksMessage);

    return;
  }

  const header = document.createElement("div");
  header.classList.add("book-header");

  const nameHeader = document.createElement("span");
  nameHeader.classList.add("book-title");

  nameHeader.textContent = "Название";

  header.appendChild(nameHeader);

  const authorHeader = document.createElement("span");
  authorHeader.classList.add("book-author-title");

  authorHeader.textContent = "Автор";
  header.appendChild(authorHeader);

  const dateHeader = document.createElement("span");

  dateHeader.classList.add("book-date-title");

  dateHeader.textContent = "Срок сдачи";

  header.appendChild(dateHeader);

  bookList.appendChild(header);

  books.forEach((book) => {
    const bookItem = document.createElement("div");

    bookItem.classList.add("book-item");

    const bookName = document.createElement("span");

    bookName.classList.add("book-name");
    bookName.textContent = book.name;

    bookItem.appendChild(bookName);

    const bookAuthor = document.createElement("span");
    bookAuthor.classList.add("book-author");

    bookAuthor.textContent = book.author;

    bookItem.appendChild(bookAuthor);

    const bookDate = document.createElement("span");

    bookDate.classList.add("book-date");
    bookDate.textContent = book.dueDate;

    bookItem.appendChild(bookDate);

    bookList.appendChild(bookItem);
  });

  let debtCount = books.length;

  document.getElementById("user-debt").textContent = debtCount;
  if (books.length === 0) {
    document.getElementById("user-debt").textContent = "Задолженностей нет"; //  Выводим сообщение
  }
  if (debtCount > 0) {
    document.getElementById("user-debt").style.color = "#41a0ff";
  } else {
    document.getElementById("user-debt").style.color = "#ea242e";
  }
}

// Функция для поиска книг

function searchBookSetup() {
  //Инициализация функции

  const account = getLoggedInAccount();
  const findButton = document.getElementById("find");

  if (account && (account.role === "admin" || account.role === "librarian")) {
    findButton.style.display = "block"; // Показываем кнопку поиска для админа/библиотекаря
    document.getElementById("searchForm").style.display = "flex";
    document.getElementById("booksTable").style.display = "table";

    findButton.addEventListener("click", searchBook);
  } else {
    // Для обычного пользователя поиск скрыт
    document.getElementById("searchForm").style.display = "none";
    document.getElementById("booksTable").style.display = "none";

    findButton.removeEventListener("click", searchBook);
  }
}

function searchBook(event) {
  event.preventDefault(); // Отменяем перезагрузку страницы

  const searchInput = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  const booksTable = document.getElementById("booksTable");
  const resultContainer = document.getElementById("result");
  const booksTableBody = document.getElementById("booksTableBody");

  booksTableBody.innerHTML = "";

  const books = JSON.parse(localStorage.getItem("books")) || [];

  const filteredBooks = books.filter((book) => {
    return (
      book["Название"].toLowerCase().includes(searchInput) ||
      book["Автор"].toLowerCase().includes(searchInput) ||
      String(book["Количество"]).includes(searchInput)
    );
  });

  if (filteredBooks.length === 0) {
    resultContainer.innerHTML = `<p>Книги не найдены</p>`;
    booksTable.style.display = "none";
  } else {
    resultContainer.innerHTML = ``;
    booksTable.style.display = "table";

    filteredBooks.forEach((book) => {
      const row = document.createElement("tr");

      // Название
      const nameCell = row.insertCell();
      nameCell.textContent = book["Название"];

      // Автор
      const authorCell = row.insertCell();
      authorCell.textContent = book["Автор"];

      // Количество
      const quantityCell = row.insertCell();
      quantityCell.textContent = book["Количество"];

      // Кнопка "Взять книгу"
      const actionCell = row.insertCell();
      actionCell.style.display = "flex";
      actionCell.style.justifyContent = "center";
      actionCell.style.alignItems = "center";

      const takeButton = document.createElement("button");
      takeButton.classList.add("action-button");
      takeButton.textContent = "Взять книгу";
      takeButton.style.backgroundColor = "rgb(41, 128, 185)";
      takeButton.style.color = "white";
      takeButton.style.border = "none";
      takeButton.style.padding = "8px 16px";
      takeButton.style.borderRadius = "10px";
      takeButton.style.fontFamily = "Montserrat, sans-serif";

      // Добавляем кнопку в ячейку
      actionCell.appendChild(takeButton);

      // Обработчик события для кнопки
      takeButton.addEventListener("click", () => takeBook(book));

      actionCell.appendChild(takeButton);

      booksTableBody.appendChild(row);
    });
  }
}

// Функция для добавления книги к списку взятых

function takeBook(book) {
  const studentId = localStorage.getItem("currentStudentId"); //  Получаем id студента
  if (!studentId) return; //  Если нет ID, значит, это личный кабинет обычного пользователя

  let takenBooks = JSON.parse(localStorage.getItem(TAKEN_BOOKS_KEY)) || [];
  let userBooks = takenBooks.find((item) => item.userId === studentId);

  if (!userBooks) {
    userBooks = { userId: studentId, books: [] };
    takenBooks.push(userBooks);
  }

  let isAlreadyTaken = userBooks.books.find((b) => b.name === book["Название"]);

  if (isAlreadyTaken) return alert("Вы уже взяли эту книгу!");

  userBooks.books.push({
    name: book["Название"],

    author: book["Автор"],

    dueDate: "01.02.2024", //  Или  другая  логика для установки  срока
  });

  saveTakenBooksToLocalStorage(takenBooks); // Добавлено
  alert(`Книга "${book["Название"]}" успешно выдана.`); // Оповещаем
  // Обновляем  список взятых книг, если  пользователь  находится в  личном  кабинете

  displayUserBooks(userBooks.books);
  decreaseBookQuantity(book);
}
function decreaseBookQuantity(book) {
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  const bookToUpdate = books.find((b) => b.Название === book.Название);

  if (bookToUpdate && bookToUpdate.Количество > 0) {
    bookToUpdate.Количество--;
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  }
}

function validateEmail(email) {
  // Регулярное выражение для  проверки email
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function saveTakenBooksToLocalStorage(takenBooks) {
  localStorage.setItem(TAKEN_BOOKS_KEY, JSON.stringify(takenBooks));
}

function logout() {
  localStorage.removeItem("loggedInEmail");
  window.location.href = "../index.html";
}
function getURLParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    fio: decodeURIComponent(params.get("fio")),

    group: decodeURIComponent(params.get("group")),
    id: decodeURIComponent(params.get("id")), //  Получаем id
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = getURLParams(); // Получаем параметры из URL *ПЕРЕД* вызовом displayUserInfo
  const loggedInAccount = getLoggedInAccount();

  // Если параметры есть:
  if (urlParams.fio && urlParams.group) {
    const studentId = parseInt(urlParams.id, 10); // Преобразуем id в число

    const students = JSON.parse(localStorage.getItem(STUDENTS_KEY)) || [];

    // Ищем студента по id, а не по индексу
    const student = students.find((s) => s.id === studentId);

    if (student) {
      document.querySelector(".book-list").style.display = "block"; //  Делаем видимым
      displayStudentInfo(urlParams, studentId); // Передаем studentId
      // ... (остальной код)
    } else {
      alert("Студент не найден!");
    }
  } else if (loggedInAccount) {
    // Если залогинился обычный пользователь
    displayUserInfo(loggedInAccount);
    searchBookSetup();
    document.querySelector(".book-list").style.display = "block";
    document.getElementById("goToLibrary").style.display = "block";
    document.getElementById("logout").style.display = "block";
  } else if (!loggedInAccount && !urlParams.fio) {
    //  Если  нет  ни URL-параметров, ни залогиненного пользователя, перенаправляем на  главную
    window.location.href = "../index.html";
  }
});

function displayStudentInfo(studentData, studentId) {
  // Отобразить информацию студента, скрыв данные пользователя
  document.getElementById("user-name").textContent = studentData.fio;

  document.getElementById("user-group").textContent = studentData.group;
  document.getElementById("user-photo").src = studentData.photo;
  // Отображаем задолженности из localStorage, используя studentId
  const userBooks = loadUserBooks(studentId); // Здесь используем studentId
  displayUserBooks(userBooks);
  localStorage.setItem("currentStudentId", studentId);

  const account = getLoggedInAccount();
  if (account && (account.role === "admin" || account.role === "librarian")) {
    searchBookSetup(); //  Вызываем searchBookSetup, чтобы отобразить поиск и таблицу с книгами

    //  Дополнительно: можете добавить здесь логику для кнопки "Сдать книгу", если нужно
  }
}

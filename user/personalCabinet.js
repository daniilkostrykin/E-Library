document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM загружен");
  const account = getLoggedInAccount();

  if (!account) {
    alert("Вы не авторизованы!");
    window.location.href = "../index.html";
    return;
  }

  displayUserInfo(account);

  const params = new URLSearchParams(window.location.search);
  const studentEmail = decodeURIComponent(params.get("email"));

  if (studentEmail) {
    // Загружаем  данные студента
    loadStudentData(studentEmail); //  Передаем  email, а  не id

    document.getElementById("controls").style.display = "none"; // Или  делаем кнопки неактивными
    document.getElementById("booksTable").style.display = "none"; //Прячем таблицу книг для пользователей
    document.getElementById("searchForm").style.display = "block"; //Отображаем  поиск
    document.getElementById("takeBook").style.display = "block"; // Показать кнопку для выдачи книг

    // Добавляем обработчик события
    document.getElementById("find").addEventListener("click", searchBook);
  }
});

function getLoggedInAccount() {
  const loggedInEmail = localStorage.getItem("loggedInEmail");
  if (!loggedInEmail) return null;

  const accounts = JSON.parse(localStorage.getItem("accounts")) || [];
  return accounts.find((account) => account.email === loggedInEmail);
}

function displayUserInfo(account) {
  if (!account) return;

  document.getElementById("user-name").textContent =
    account.name || "Нет данных";
  document.getElementById("user-group").textContent =
    account.group || "Нет данных";

  const debts = account.debts || [];
  document.getElementById("user-debt").textContent =
    debts.length > 0 ? debts.length : "Нет задолженностей";
  document.getElementById("user-debt").style.color =
    debts.length > 0 ? "#ea242e" : "#41a0ff";
}

function loadStudentData(studentEmail) {
  const takenBooks = JSON.parse(localStorage.getItem("takenBooks")) || [];
  let userBooks = takenBooks.find((item) => item.userEmail === studentEmail);

  const userBookList = userBooks ? userBooks.books : [];

  const accounts = JSON.parse(localStorage.getItem("accounts")) || []; // Get accounts from localStorage
  let user = accounts.find((item) => item.email === studentEmail); // Get the actual account and student

  // Update DOM elements with student data
  document.getElementById("user-name").textContent = user.name;
  document.getElementById("user-group").textContent = user.group;

  displayUserBooks(userBookList, studentEmail); // Передаем user.debts
}


function displayUserBooks(books, studentEmail) {
  const bookList = document.querySelector(".book-list");
  bookList.style.display = "block";
  bookList.innerHTML = ""; // Clear the book list

  if (!books || books.length === 0) {
    bookList.innerHTML = "<p>Нет взятых книг</p>";
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

    if (book.returnedDate) {
      bookItem.innerHTML = `
        <span class="book-name returned">${book.name} (Возвращена ${book.returnedDate})</span>
        <span class="book-author returned">${book.author}</span>
        <span class="book-date returned">${book.dueDate}</span>
      `;
    } else {
      bookItem.innerHTML = `
        <span class="book-name">${book.name}</span>
        <span class="book-author">${book.author}</span>
        <span class="book-date">${book.dueDate}</span>
      `;
    }

    bookList.appendChild(bookItem);
  });

  let debtCount = books.filter((book) => !book.returnedDate).length; // filter only books not returned
  document.getElementById("user-debt").textContent = debtCount;

  document.querySelector('h3').style.display = 'block';
  bookList.style.display = 'block';
}


function searchBook(event) {
  if(event){ //Check if event exists. If there is not event, then the function will run by the user
    event.preventDefault();//stop standart action 
}
  const account = getLoggedInAccount(); // Получаем данные текущего пользователя
  if (!account || (account.role !== "admin" && account.role !== "librarian")) {
    document.getElementById("search-area").style.display = "none";
    return; // Прерываем, если это не администратор или библиотекарь
  }

  const searchInput = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  if (searchInput === "") {
    displayBooks(originalBooks); // Отображаем все книги, если строка поиска пустая
    return;
  }

  const books = JSON.parse(localStorage.getItem("books")) || [];
  const filteredBooks = books.filter((book) => {
    return (
      book["Название"].toLowerCase().includes(searchInput) ||
      book["Автор"].toLowerCase().includes(searchInput) ||
      String(book["Количество"]).includes(searchInput)
    );
  });

  const booksTable = document.getElementById("booksTable");
  const booksTableBody = document.getElementById("booksTableBody");

  booksTableBody.innerHTML = ""; // очищаем

  if (filteredBooks.length === 0) {
    document.getElementById("result").innerHTML = "<p>Книги не найдены</p>";
    booksTable.style.display = "none"; // Скрываем таблицу
  } else {
    document.getElementById("result").innerHTML = "";
    booksTable.style.display = "table";

    filteredBooks.forEach((book) => {
      const row = document.createElement("tr");
      const takeButton = document.createElement("button");
      takeButton.textContent = "Выдать";

      // Изменено: передаем email студента в giveBook
      takeButton.addEventListener("click", () => giveBook(book, studentEmail));

      row.appendChild(takeButton);
      booksTableBody.appendChild(row);
    });
  }
}
function giveBook(book, email) {
  const account = getLoggedInAccount();
  let takenFor;

  if (email) {
    takenFor = email; // email передан
  } else if (account && account.role !== "user") {
    takenFor = prompt("Введите email пользователя");
  }

  if (!takenFor) return alert("Email не введен");
  if (!validateEmail(takenFor)) return alert('Email не корректный');

  // Загрузите книги
  let takenBooks = JSON.parse(localStorage.getItem("takenBooks")) || [];

  // Ищите пользователя
  let userBooksData = takenBooks.find((item) => item.userEmail === takenFor);

  // Если не найдено, создайте новую запись.
  if (!userBooksData) {
    userBooksData = { userEmail: takenFor, books: [] };
    takenBooks.push(userBooksData);
  }

  // Получаем список взятых книг пользователя:
  const userBooks = userBooksData.books;

  let isAlreadyTaken = userBooks.find((b) => b.name === book.Название);

  // Проверка на дублирование
  if (isAlreadyTaken) {
    return alert("Эта книга уже была выдана пользователю");
  }

  userBooks.push({ name: book.Название, author: book.Автор, dueDate: "01.02.2024" });

  saveTakenBooksToLocalStorage(takenBooks);

  const accounts = JSON.parse(localStorage.getItem("accounts"));
  const updatedAccount = accounts.find((acc) => acc.email === takenFor);

  updateStudentsDebtData(accounts); // Обновляем данные задолженностей

  localStorage.setItem('accounts', JSON.stringify(accounts));

  // Обновим отображение
  displayUserBooks(userBooks, email);

  alert(`Книга "${book.Название}" успешно выдана пользователю ${takenFor}`);
}

function saveTakenBooksToLocalStorage(takenBooks) {
  localStorage.setItem("takenBooks", JSON.stringify(takenBooks));
}

function goToLibrary() {
  window.location.href = "../library/library.html";
}
function logout() {
  localStorage.removeItem("loggedInEmail");
  window.location.href = "../index.html";
}
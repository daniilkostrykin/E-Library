// user.js
function goToLibrary() {
  window.location.href = "user_library.html"; // Путь к вашей странице с библиотекой
}
document.addEventListener("DOMContentLoaded", () => {
  const account = getLoggedInAccount();
  displayUserInfo(account);
});

function displayUserInfo(account) {
  if (account) {
    document.getElementById("user-name").textContent = account.name;
    document.getElementById("user-group").textContent = account.group;

    // Путь к картинке
    document.getElementById("user-photo").src = "../assets/dima.jpg";

    // Здесь загружаете массив  userBooks  (взятые пользователем книги)
    const userBooks = loadUserBooks(account.email);
    //Здесь отобразите эти книги  на  странице.  Пример :

    displayUserBooks(userBooks);
  }
}
function getLoggedInAccount() {
  // Получаем email из localStorage (если есть, значит, залогинен)
  const loggedInEmail = localStorage.getItem("loggedInEmail");

  if (!loggedInEmail) return null;

  const accounts = JSON.parse(localStorage.getItem("accounts")) || [];
  return accounts.find((account) => account.email === loggedInEmail);
}

//user.js

// Функция для загрузки данных о книгах пользователя
function loadUserBooks(userEmail) {
  // На данный момент у вас  нет  хранилища  взятых книг, но  я  набросаю логику:

  const takenBooks = JSON.parse(localStorage.getItem("takenBooks")) || [];

  // Пример данных для  тестирования
  //     const takenBooks = [

  //       { userEmail: 'user1@mail.ru', books: [ { name:'Мастер и Маргарита', author:'М.Булгаков', dueDate: '11.06.2025'},
  //                             {name:'Бесы', author:'Ф.М.Достоевский', dueDate: '15.06.2025'} ]},

  //       { userEmail:'user2@gmail.com',  books: [{name:'Три мушкетера', author:'Александр Дюма', dueDate: '01.07.2024' }]}

  //     ];

  localStorage.setItem("takenBooks", JSON.stringify(takenBooks));

  const userBookData = takenBooks.find((item) => item.userEmail === userEmail);

  if (userBookData) {
    return userBookData.books; // Возвращает массив книг или  undefined
  } else {
    return [];
  }
}
//  Функция для отображения списка книг пользователя
function displayUserBooks(books) {
  const bookList = document.querySelector(".book-list");

  // Очищаем предыдущие элементы из списка книг (если они есть)
  bookList.innerHTML = "";

  if (books.length === 0) {
    // Если список пуст, показываем сообщение
    const noBooksMessage = document.createElement("p");
    noBooksMessage.textContent = "Нет взятых книг";
    noBooksMessage.style.textAlign = "center";
    noBooksMessage.style.fontSize = "18px";
    noBooksMessage.style.color = "#555"; // Мягкий оттенок текста
    bookList.appendChild(noBooksMessage);
    return; // Выходим из функции, чтобы не добавлять заголовки и элементы
  }

  // Добавляем заголовки столбцов
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

  // Добавляем книги в список
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

  // Обновляем количество задолженностей
  let debtCount = books.length;
  document.getElementById("user-debt").textContent = debtCount;

  if (debtCount > 0) {
    document.getElementById("user-debt").style.color = "#41a0ff";
  } else {
    document.getElementById("user-debt").style.color = "#ea242e";
  }
}


function logout() {
  localStorage.removeItem("loggedInEmail"); //  Удаляем email  из localStorage
  window.location.href = "../index.html";
}

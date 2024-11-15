// personalCabinet.js
const BOOKS_KEY = "books";
const STUDENTS_KEY = "students"; //  Ключ для студентов
const TAKEN_BOOKS_KEY = "takenBooks"; //  Ключ для взятых книг
function goToLibrary() {
  window.location.href = "../library/library.html";
}

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

  document.querySelector("h3").style.display = "block";
  bookList.style.display = "block";
}

function searchBook(event) {
  if (event) {
    //Check if event exists. If there is not event, then the function will run by the user
    event.preventDefault(); //stop standart action
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

  // Функция для добавления книги к списку взятых

  function takeBook(book) {
    let studentId = localStorage.getItem("currentStudentId"); // Получаем id студента
    console.log("studentId в takeBook:", studentId, typeof studentId);
    studentId = parseInt(studentId, 10);

    if (!studentId) return; // Если нет ID, значит, это личный кабинет обычного пользователя
    // Получаем список книг из LocalStorage
    const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
    // Находим книгу по названию
    const bookToTake = books.find((b) => b.Название === book["Название"]);
    // Проверяем, есть ли книга и есть ли доступное количество
    if (!bookToTake) {
      return alert("Эта книга в данный момент отсутствует.");
    }
    if (bookToTake.Количество === 0) {
      return alert("Книга закончилась и сейчас нет в наличии.");
    }
    let takenBooks = JSON.parse(localStorage.getItem(TAKEN_BOOKS_KEY)) || [];
    let userBooks = takenBooks.find((item) => item.userId === studentId);
    console.log("takenBooks  в loadUserBooks:", takenBooks); //  Проверьте  структуру takenBooks
    if (!userBooks) {
      userBooks = { userId: studentId, books: [] };
      takenBooks.push(userBooks);
    }
    if (userBooks.books.some((b) => b.name === book["Название"])) {
      return alert("Вы уже взяли эту книгу!");
    }
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    userBooks.books.push({
      name: book["Название"],
      author: book["Автор"],
      dueDate: dueDate.toISOString().split("T")[0],
    });
    // Обновляем данные о взятых книгах в LocalStorage
    saveTakenBooksToLocalStorage(takenBooks);
    // Уменьшаем количество книги в библиотеке
    decreaseBookQuantity(bookToTake, studentId);

    updateStudentsDebtData(accounts); // Обновляем данные задолженностей

    // Удаляем строку с выданной книгой из таблицы
    removeBookRow(book);
    // Проверяем, есть ли еще книги в таблице
    const booksTableBody = document.getElementById("booksTableBody");
    if (booksTableBody.children.length === 0) {
      const booksTable = document.getElementById("booksTable");
      booksTable.style.display = "none"; // Скрываем таблицу, если книг больше нет
    }
    // Обновляем интерфейс пользователя (книги, которые были взяты)
    displayUserBooks(userBooks.books);
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
  function getURLParams() {
    const params = new URLSearchParams(window.location.search);

    return {
      fio: params.get("fio") ? decodeURIComponent(params.get("fio")) : null,
      group: params.get("group")
        ? decodeURIComponent(params.get("group"))
        : null,
      id: params.get("id") ? decodeURIComponent(params.get("id")) : null, // Добавлено приведение к числу при необходимости
    };
  }

  function increaseBookQuantity(book) {
    const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
    const bookToUpdate = books.find((b) => b.Название === book.name);

    if (bookToUpdate) {
      bookToUpdate.Количество++;
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Страница загружена. Инициализация...");

    const urlParams = getURLParams(); // Получаем параметры из URL
    console.log("URL Params:", urlParams);

    let account, studentId;

    if (urlParams.id) {
      studentId = parseInt(urlParams.id, 10);

      console.log("Student ID (parsed):", studentId);

      let students = localStorage.getItem(STUDENTS_KEY);
      console.log("Raw students data from localStorage:", students);

      if (students) {
        try {
          students = JSON.parse(students);

          console.log("Students  array:", students);

          account = students.find((student) => student.id === studentId);

          if (account) {
            displayStudentInfo(account, studentId); //  studentId  передаем  как аргумент
          } else {
            console.warn("Студент с указанным ID  не найден.");
            alert("Студент с  указанным ID не  найден.");

            return; //  Прерываем выполнение, если  студент не найден
          }
        } catch (error) {
          console.error("Error  parsing students  data:", error);
          alert("Ошибка  загрузки данных студентов. Данные  повреждены.");

          return;
        }
      } else {
        console.warn(
          "No  students found  in LocalStorage  using key",
          STUDENTS_KEY
        );
        alert("Данные студентов отсутствуют  в LocalStorage.");
        return;
      }
    } else {
      // Если id  нет,  загружаем  текущий вошедший  аккаунт

      account = getLoggedInAccount();

      // console.log("Загружен текущий аккаунт:", account)
    }

    if (account) {
      console.log("Account  found:", account);

      displayUserInfo(account); //  Отображаем данные  пользователя

      searchBookSetup(); // Инициализация  поиска

      document.querySelector(".book-list").style.display = "block"; // Отображаем  список  книг

      document.getElementById("goToLibrary").style.display = "block";

      document.getElementById("logout").style.display = "block";
    } else {
      console.error("Не удалось  загрузить  данные аккаунта.");

      alert("Не  удалось загрузить данные аккаунта.");

      if (!urlParams.fio && !urlParams.group && !urlParams.id) {
        console.warn("Редирект  на главную страницу.");
        window.location.href = "../index.html";
      }
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
    console.log(
      "Setting currentStudentId in displayStudentInfo. studentId, type:",
      studentId,
      typeof studentId
    );

    localStorage.setItem("currentStudentId", String(studentId));

    const account = getLoggedInAccount();
    if (account && (account.role === "admin" || account.role === "librarian")) {
      searchBookSetup(); //  Вызываем searchBookSetup, чтобы отобразить поиск и таблицу с книгами

      //  Дополнительно: можете добавить здесь логику для кнопки "Сдать книгу", если нужно
    }
  }
}

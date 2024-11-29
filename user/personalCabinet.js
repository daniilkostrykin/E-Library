// personalCabinet.js
axios.defaults.baseURL = "http://localhost:3000";

const BOOKS_KEY = "books";
const STUDENTS_KEY = "students"; //  Ключ для студентов
const TAKEN_BOOKS_KEY = "takenBooks"; //  Ключ для взятых книг
function goToLibrary() {
  window.location.href = "../library/library.html";
}
function logout() {
  localStorage.removeItem("token"); //  удалить  токен после  выхода

  localStorage.removeItem("loggedInEmail");

  window.location.href = "../index.html";

  console.log("Logged out and redirected to index.html"); // все выходы обработаны одинакого
}
/*
document.addEventListener("DOMContentLoaded", () => {
  const account = getLoggedInAccount();

  displayUserInfo(account);

  searchBookSetup(); // Инициализация поиска
});*/
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Страница загружена. Инициализация...");
  console.log("Текущий URL:", window.location.href);

  const urlParams = getURLParams();
  console.log("URL Params:", urlParams);
  console.log("Axios base URL:", axios.defaults.baseURL);

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("JWT токен отсутствует. Редирект на страницу входа.");
    // window.location.href = "../index.html";
    return;
  }


  try {
    const account = await getLoggedInAccount();  

    if (urlParams.id) {
      const studentId = parseInt(urlParams.id, 10);
      console.log("ID студента:", studentId);
      console.log("Account:", account); // проверь  account  перед использованием
      displayUserInfo({ name: urlParams.fio, group: urlParams.group, role: 'student' }); // Получаем и отображаем данные студента
    } else {
      console.log("Загружаем текущий аккаунт...");
      account = await getLoggedInAccount();
      console.log("Account after getLoggedInAccount:", account); // !!!

      if (!account) {
        throw new Error("Данные аккаунта не найдены.");
      }
      console.log("Текущий аккаунт:", account);
      displayUserInfo(account); // Отображаем информацию о текущем пользователе
    }
    console.log("Токен из localStorage:", token);
    console.log("URL Parameters:", urlParams);
    console.log("Полученный аккаунт:", account);
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    showToast("Ошибка загрузки данных.");
    // window.location.href = "../index.html"; // Редирект на главную при ошибке
  }
});

async function displayStudentInfo(studentId) {
  try {
    const response = await axios.get(`/api/students/${studentId}`);
    const account = response.data;

    if (!account || !account.fullName) {
      throw new Error("Информация о студенте не найдена.");
    }

    document.getElementById("studentName").textContent = account.fullName;
    document.getElementById("studentGroup").textContent = account.group;
    document.getElementById("studentId").textContent = `ID: ${studentId}`;
  } catch (error) {
    console.error("Ошибка получения данных студента:", error);
    showToast("Не удалось загрузить данные студента.");
    throw error;
  }
}

function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    fio: params.get("fio"),  //  Без проверки на undefined и decodeURIComponent
    group: params.get("group"), //  Без проверки на undefined и decodeURIComponent
    id: params.get("id")      //  Добавляем id
  };
}
function displayUserInfo(account) {
  document.getElementById("user-name").textContent = account.name || ""; // fio в userData   нет

  document.getElementById("user-group").textContent = account.group || "";

  document.getElementById("user-debt").textContent = 0; //  установи начальное значение,  пока не  загружены данные о  задолженностях

  // Отображение формы поиска для администраторов и библиотекарей
  const searchForm = document.getElementById("searchForm");
  if (account.role === "librarian" || account.role === "admin") {
    searchForm.style.display = "block"; // Показываем форму поиска
  } else {
    searchForm.style.display = "none"; // Скрываем форму поиска для студентов
  }
}
async function getLoggedInAccount() {
  try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const response = await axios.get("/api/auth/user-info", {
          headers: { Authorization: `Bearer ${token}` },
      });

      console.log("User info response:", response.data); // !!!
      return response.data.user;
  } catch (error) {
      console.error("Ошибка получения данных пользователя:", error);
      return null;
  }
}
async function loadUserBooks(userId) {
  try {
    const response = await axios.get(`/api/taken-books?userId=${userId}`);
    return response.data.books || []; // Возвращаем список книг для пользователя из базы данных
  } catch (error) {
    console.error("Ошибка загрузки данных о взятых книгах:", error);
    return [];
  }
}

async function returnBook(bookId, studentId) {
  try {
    await axios.delete(`/api/taken-books`, {
      data: { bookId, studentId },
    });

    showToast("Книга успешно возвращена.");
    location.reload();
  } catch (error) {
    console.error("Error returning book:", error);
    showToast("Ошибка возврата книги.");
  }
}

async function displayUserBooks() {
  const loggedInAccount = await getLoggedInAccount(); // Получаем данные о пользователе
  const isLibrarian =
    loggedInAccount &&
    (loggedInAccount.role === "librarian" || loggedInAccount.role === "admin");

  // Получаем книги из базы данных для текущего пользователя
  const books = await getUserBooksFromDB(loggedInAccount.id); // Получаем книги с сервера по ID пользователя
  const bookList = document.querySelector(".book-list");
  bookList.innerHTML = ""; // Очищаем список

  // Проверка на пустой список книг
  if (books.length === 0) {
    const noBooksMessage = document.createElement("p");
    noBooksMessage.textContent = "Нет взятых книг";
    noBooksMessage.classList.add("no-books-message");
    bookList.appendChild(noBooksMessage);
    document.getElementById("user-debt").textContent = "0";
    document.getElementById("user-debt").style.color = "#41a0ff";
    return;
  }

  // Заголовок таблицы
  const header = document.createElement("div");
  header.classList.add("book-header");
  if (!isLibrarian) header.classList.add("no-return");

  const nameHeader = document.createElement("span");
  nameHeader.classList.add("book-title");
  nameHeader.textContent = "Название";

  const authorHeader = document.createElement("span");
  authorHeader.classList.add("book-author-title");
  authorHeader.textContent = "Автор";

  const dateHeader = document.createElement("span");
  dateHeader.classList.add("book-date-title");
  dateHeader.textContent = "Срок сдачи";

  header.appendChild(nameHeader);
  header.appendChild(authorHeader);
  header.appendChild(dateHeader);

  if (isLibrarian) {
    // Если библиотекарь, добавляем заголовок "Сдача"
    const returnHeader = document.createElement("span");
    returnHeader.classList.add("book-return-title");
    returnHeader.textContent = "Сдача";
    header.appendChild(returnHeader);
  }

  bookList.appendChild(header);

  // Строки таблицы для каждой книги
  books.forEach((book) => {
    const bookItem = document.createElement("div");
    bookItem.classList.add("book-item");
    if (!isLibrarian) bookItem.classList.add("no-return");

    const bookName = document.createElement("span");
    bookName.classList.add("book-name");
    bookName.textContent = book.name;

    const bookAuthor = document.createElement("span");
    bookAuthor.classList.add("book-author");
    bookAuthor.textContent = book.author;

    const bookDate = document.createElement("span");
    bookDate.classList.add("book-date");
    bookDate.textContent = book.dueDate;

    const returnButtonContainer = document.createElement("div");
    if (isLibrarian) {
      // Создаем кнопку "Вернуть книгу"
      const returnButton = document.createElement("button");
      returnButton.classList.add("book-return");
      returnButton.textContent = "Вернуть книгу";

      // Стили для кнопки
      returnButton.style.backgroundColor = " #41a0ff"; // Зеленый
      returnButton.style.border = "none";
      returnButton.style.color = "white";
      returnButton.style.padding = "8px 16px"; // Увеличил padding для кнопки
      returnButton.style.textAlign = "center";
      returnButton.style.textDecoration = "none";
      returnButton.style.display = "inline-block";
      returnButton.style.fontSize = "16px"; // Увеличил размер шрифта
      returnButton.style.margin = "0 2px"; // Добавил margin
      returnButton.style.cursor = "pointer"; // Указатель мыши при наведении

      returnButton.addEventListener("click", () => {
        console.log("Клик на кнопку");
        openReturnModal(book); // Открываем модальное окно возврата книги
      });

      returnButtonContainer.style.textAlign = "right"; // Выравнивание по правому краю

      returnButtonContainer.appendChild(returnButton);
    }
    bookItem.appendChild(bookName);
    bookItem.appendChild(bookAuthor);
    bookItem.appendChild(bookDate);
    if (isLibrarian) {
      bookItem.appendChild(returnButtonContainer); // Добавляем контейнер с кнопкой
    }
    bookList.appendChild(bookItem);
  });

  // Обновляем задолженности
  let debtCount = books.length;
  const userDebtElement = document.getElementById("user-debt");
  userDebtElement.textContent = `${debtCount}`;
  userDebtElement.style.color = debtCount > 0 ? "#ea242e" : "#41a0ff";
}

// Функция для получения книг пользователя из базы данных
async function getUserBooksFromDB(userId) {
  try {
    const response = await axios.get(`/api/taken-books/${userId}`);
    return response.data.books; // возвращаем список книг из ответа сервера
  } catch (error) {
    console.error("Ошибка при получении взятых книг:", error);
    return []; // Возвращаем пустой массив в случае ошибки
  }
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
//Взятие книги
let bookToReturn = null; // Переменная для хранения информации о книге
let isReturnModalOpen = false; // Новая переменная

// Функция для открытия модального окна
function openReturnModal(book) {
  console.log("Открытие модального окна для книги:", book); // Для отладки
  if (isReturnModalOpen) {
    // Проверка, открыто ли уже модальное окно
    showToast("Вы уже пытаетесь вернуть книгу.");
    return;
  }
  bookToReturn = book;
  document.getElementById(
    "returnBookMessage"
  ).textContent = `Вы уверены, что хотите вернуть книгу "${book.name}"?`;
  document.getElementById("returnBookModal").style.display = "block";
  isReturnModalOpen = true; // Устанавливаем флаг
}

// Функция для закрытия модального окна
function closeReturnModal() {
  document.getElementById("returnBookModal").style.display = "none";
  isReturnModalOpen = false; // Устанавливаем флаг
}
async function getStudentIdByEmail(email) {
  try {
    // Отправляем запрос на сервер для поиска студента по email
    const response = await axios.get(`/api/students/findByEmail?email=${email}`);
    
    // Проверяем, если студент найден
    if (response.data && response.data.id) {
      return response.data.id;
    } else {
      throw new Error("Студент не найден.");
    }
  } catch (error) {
    console.error("Ошибка при получении studentId:", error);
    throw new Error("Произошла ошибка при получении данных студента.");
  }
}

// Функция для подтверждения взятия книги
async function confirmReturnBook() {
  console.log("Клик на кнопку confirm");
  try {
    if (bookToReturn) {
      const studentId = await getStudentIdByEmail(studentEmail);
      console.log("Student ID:", studentId);
      if (!studentId) {
        showToast("Ошибка: текущий студент не определен.");
        closeReturnModal();
        return;
      }

      // Fetch the user's books from the database
      const response = await axios.get(`/api/taken-books/${studentId}`);
      const userBooksData = response.data;

      if (!userBooksData || userBooksData.books.length === 0) {
        showToast("У вас нет взятых книг.");
        closeReturnModal();
        return;
      }

      // Find the book to return
      const bookIndex = userBooksData.books.findIndex(
        (b) => b.name === bookToReturn.name
      );

      if (bookIndex === -1) {
        showToast("У вас нет этой книги.");
        closeReturnModal();
        return;
      }

      // Remove the book from user's borrowed books
      userBooksData.books.splice(bookIndex, 1);

      // If user has no more books, remove their record
      if (userBooksData.books.length === 0) {
        await axios.delete(`/api/taken-books/${studentId}`);
      } else {
        await axios.put(`/api/taken-books/${studentId}`, userBooksData);
      }

      // Return the book to the library (update book count)
      const booksResponse = await axios.get("/api/books");
      const books = booksResponse.data;
      const bookInLibrary = books.find(
        (b) => b["Название"] === bookToReturn.name
      );

      if (bookInLibrary) {
        bookInLibrary["Количество"]++;
        await axios.put(`/api/books/${bookInLibrary.id}`, bookInLibrary);
      }

      // Update UI
      displayUserBooks(userBooksData.books);
      showToast(`Книга "${bookToReturn.name}" успешно возвращена.`);
      closeReturnModal();
      bookToReturn = null;
      updateBooksTable();
    } else {
      showToast("Ошибка: книга не выбрана.");
      closeReturnModal();
    }
  } catch (error) {
    showToast("Произошла ошибка при загрузке данных.");
    console.error(error);
    closeReturnModal();
    return;
  }
}

document
  .getElementById("confirmReturnBtn")
  .addEventListener("click", confirmReturnBook);

function searchBookSetup() {
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim().toLowerCase();
    try {
      const response = await axios.get(`/api/books`, {
        params: { query },
      });
      displayBooks(response.data);
    } catch (error) {
      console.error("Error fetching books:", error);
      showToast("Ошибка поиска книг.");
    }
  });
}

async function searchBook() {
  clearPreviousResults(); // Очищаем предыдущие результаты
  const query = document.getElementById("searchInput").value.trim().toLowerCase(); // Получаем запрос из поля

  const bookTable = document.getElementById("bookTable"); // Ссылка на таблицу книг
  const resultContainer = document.getElementById("result"); // Контейнер для сообщений

  // Если поле поиска НЕ пустое
  if (query !== "") {
    try {
      const books = await fetchBooks(query); // Получаем книги, соответствующие запросу
      displayBooks(books); // Отображаем эти книги
      resultContainer.innerHTML = ""; // Очищаем сообщение об отсутствии книг
    } catch (error) {
      console.error("Ошибка при поиске книг:", error);
      resultContainer.innerHTML = "<p>Ошибка при поиске книг. Попробуйте позже.</p>";
    }
  } else {
    // Если запрос пустой, отображаем всю таблицу
    try {
      const books = await fetchBooks(""); // Получаем все книги
      displayBooks(books); // Отображаем все книги
      resultContainer.innerHTML = ""; // Очищаем сообщение об отсутствии книг
    } catch (error) {
      console.error("Ошибка при получении всех книг:", error);
      resultContainer.innerHTML = "<p>Ошибка при загрузке всех книг. Попробуйте позже.</p>";
    }
  }

  // Обновляем margin в зависимости от наличия данных в таблице
  updateControlsMargin(bookTable !== null);
}

// Функция для получения книг с сервера
async function fetchBooks(query = "") {
  try {
    const response = await axios.get("/api/books", { params: { query } });
    return response.data; // Возвращаем данные книг
  } catch (error) {
    console.error("Ошибка при получении книг:", error);
    return [];
  }
}

// Функция для отображения списка книг
function displayBooks(books) {
  const booksTableBody = document.getElementById("booksTableBody"); // Ссылка на тело таблицы
  booksTableBody.innerHTML = ""; // Очищаем предыдущие строки таблицы

  if (books.length === 0) {
    // Если книги не найдены, показываем сообщение
    document.getElementById("result").innerHTML = "<p>Книги не найдены</p>";
  } else {
    books.forEach((book) => {
      const row = booksTableBody.insertRow(); // Создаем строку

      // Заполняем ячейки строк
      const titleCell = row.insertCell();
      titleCell.textContent = book.title;

      const authorCell = row.insertCell();
      authorCell.textContent = book.author;

      const countCell = row.insertCell();
      countCell.textContent = book.quantity;
      countCell.style.color = "rgb(102, 191, 102)";

      const actionCell = row.insertCell();
      actionCell.style.display = "flex";
      actionCell.style.justifyContent = "center";
      actionCell.style.alignItems = "center";

      const takeButton = document.createElement("button");
      takeButton.textContent = "Взять книгу";
      takeButton.style.backgroundColor = "rgb(41, 128, 185)";
      takeButton.style.color = "white";
      takeButton.style.border = "none";
      takeButton.style.padding = "8px 16px";
      takeButton.style.borderRadius = "10px";
      takeButton.style.fontFamily = "Montserrat, sans-serif";

      takeButton.addEventListener("click", () => {
        openTakeModal(book);
      });
      actionCell.appendChild(takeButton); // Добавляем кнопку "Взять книгу"
    });
  }
}

let bookToTake = null;
let isTakeModalOpen = false;

// Функция для открытия модального окна
function openTakeModal(book) {
  if (isTakeModalOpen) {
    // Проверка, открыто ли уже модальное окно
    showToast("Вы уже пытаетесь взять книгу.");
    return;
  }
  bookToTake = book;
  document.getElementById(
    "takeBookMessage"
  ).textContent = `Вы уверены, что хотите взять книгу "${book.Название}"?`;
  document.getElementById("takeBookModal").style.display = "block";
  isTakeModalOpen = true; // Устанавливаем флаг
}

// Функция для закрытия модального окна
function closeTakeModal() {
  document.getElementById("takeBookModal").style.display = "none";
  isTakeModalOpen = false; // Устанавливаем флаг
}

// Функция для подтверждения взятия книги
async function confirmTakeBook() {
  if (bookToTake) {
    const studentId = await getStudentIdByEmail(studentEmail);
    console.log("Student ID:", studentId);
    if (!studentId) {
      showToast("Ошибка: текущий студент не определен.");
      closeTakeModal();
      return;
    }

    // Fetch available books and the user's current borrowed books from the DB
    const [booksResponse, takenBooksResponse] = await Promise.all([
      axios.get("/api/books"),
      axios.get(`/api/taken-books/${studentId}`),
    ]);

    const books = booksResponse.data;
    const userBooksData = takenBooksResponse.data;

    const bookInLibrary = books.find((b) => b.Название === bookToTake.Название);

    if (!bookInLibrary || bookInLibrary.Количество === 0) {
      showToast("Эта книга в данный момент отсутствует.");
      closeTakeModal();
      return;
    }

    if (userBooksData.books.some((b) => b.name === bookToTake.Название)) {
      showToast("Вы уже взяли эту книгу!");
      closeTakeModal();
      return;
    }

    // Calculate the due date and add the book to the user's list
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const formattedDueDate = formatDate(dueDate);

    userBooksData.books.push({
      name: bookToTake.Название,
      author: bookToTake.Автор,
      dueDate: formattedDueDate,
    });

    await axios.put(`/api/taken-books/${studentId}`, userBooksData);

    // Decrease the book quantity in the library
    bookInLibrary.Количество--;
    await axios.put(`/api/books/${bookInLibrary.id}`, bookInLibrary);

    // Update UI
    displayUserBooks(userBooksData.books);
    updateBooksTable(books);

    showToast(`Книга "${bookToTake.Название}" успешно взята.`);
    closeTakeModal();
    bookToTake = null;
    updateBooksTable();
  } else {
    showToast("Ошибка: книга не выбрана.");
    closeTakeModal();
  }
}

// Привязываем событие к кнопке подтверждения
document
  .getElementById("confirmTakeBtn")
  .addEventListener("click", confirmTakeBook);

// Функция для добавления книги к списку взятых

async function takeBook(book) {
  const studentId = await getStudentIdByEmail(studentEmail);
  console.log("Student ID:", studentId);
  if (!studentId) {
    showToast("Ошибка: текущий студент не определен.");
    return;
  } // Если нет ID, значит, это личный кабинет обычного пользователя

  try {
    // 1. Проверяем доступность книги на сервере
    const bookAvailabilityResponse = await axios.get(`/api/books/${book.id}`); // Предполагаем, что у вас есть endpoint для получения книги по ID

    if (
      !bookAvailabilityResponse.data ||
      bookAvailabilityResponse.data.quantity === 0
    ) {
      showToast("Эта книга в данный момент отсутствует.");
      return;
    }

    // 2. Проверяем, не взял ли студент эту книгу уже
    const hasBookResponse = await axios.get(`/api/taken-books/check`, {
      params: {
        studentId: studentId,
        bookId: book.id,
      },
    });

    if (hasBookResponse.data.hasBook) {
      showToast("Вы уже взяли эту книгу!");
      return;
    } // 3. Добавляем запись о взятой книге в БД
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const formattedDueDate = dueDate.toISOString().split("T")[0]; // Форматируем дату

    const takeBookResponse = await axios.post("/api/taken-books", {
      studentId: studentId,
      bookId: book.id,
      dueDate: formattedDueDate,
    });
    // 4. Обновляем данные на клиенте (локально)
    // (a) Уменьшаем количество книг (можно оптимизировать и получать с сервера)
    const updatedBooksResponse = await axios.get("/api/books");
    localStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooksResponse.data)); // весь список книг

    // (b) Получаем список взятых книг студента и обновляем отображение
    const userBooksResponse = await axios.get(
      `/api/taken-books/student/${studentId}`
    );
    displayUserBooks(userBooksResponse.data);

    // (c) Обновляем таблицу книг (можно оптимизировать, обновляя только строку)
    updateBooksTable(updatedBooksResponse.data);

    // (d) Удаляем строку из таблицы, если книг больше нет (как и раньше)
    removeBookRow(book);
    const booksTableBody = document.getElementById("booksTableBody");
    if (booksTableBody.children.length === 0) {
      document.getElementById("booksTable").style.display = "none";
    } else {
      showToast("Ошибка при взятии книги.");
      console.error(
        "Ошибка сервера:",
        takeBookResponse.status,
        takeBookResponse.data
      );
    }
  } catch (error) {
    console.error("Ошибка при взятии книги:", error);
    showToast("Ошибка при взятии книги. Пожалуйста, попробуйте позже.");
  }
}

function removeBookRow(book) {
  const rows = document
    .getElementById("booksTableBody")
    .getElementsByTagName("tr");

  for (let row of rows) {
    const cells = row.getElementsByTagName("td");
    const bookTitle = cells[0].textContent.trim(); // Название книги в первой ячейке

    if (bookTitle === book["Название"]) {
      row.remove(); // Удаляем строку, если название книги совпадает
      break; // Прерываем цикл, так как нужная строка удалена
    }
  }
}

async function updateBooksTable() {
  const booksResponse = await axios.get("/api/books");
  const books = booksResponse.data;
  const booksTableBody = document.getElementById("booksTableBody");

  const takenBooksResponse = await axios.get("/api/taken-books");
  const takenBooks = takenBooksResponse.data;
  const studentId = await getStudentIdByEmail(studentEmail);
  console.log("Student ID:", studentId);
  booksTableBody.innerHTML = ""; // Clear the table

  books.forEach((book) => {
    if (book["Количество"] === 0) return;
    const row = document.createElement("tr");

    const nameCell = row.insertCell();
    nameCell.textContent = book["Название"];

    const authorCell = row.insertCell();
    authorCell.textContent = book["Автор"];

    const quantityCell = row.insertCell();
    quantityCell.textContent = book["Количество"];
    quantityCell.style.color = "rgb(102, 191, 102)";

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

    const userTakenBooks = takenBooks.find(
      (entry) => entry.userId === currentUserId
    );
    const isBookTaken =
      userTakenBooks &&
      userTakenBooks.books.some(
        (takenBook) => takenBook.name === book["Название"]
      );

    if (isBookTaken) {
      takeButton.disabled = true;
      takeButton.style.backgroundColor = "gray";
      takeButton.style.cursor = "not-allowed";
      takeButton.textContent = "Книга взята";
    } else {
      takeButton.addEventListener("click", () => openTakeModal(book));
    }
    actionCell.appendChild(takeButton);

    row.appendChild(nameCell);
    row.appendChild(authorCell);
    row.appendChild(quantityCell);
    row.appendChild(actionCell);

    booksTableBody.appendChild(row);
  });
}

async function decreaseBookQuantity(book, studentId) {
  try {
    const response = await axios.post(`${API_URL}/decrease`, {
      Название: book.Название,
      studentId: studentId,
    });

    if (response.data.success) {
      console.log("Book quantity decreased:", response.data.book);

      const librarianWindow = window.opener;
      if (librarianWindow) {
        librarianWindow.postMessage(
          {
            type: "updateBookQuantity",
            bookTitle: book.Название,
            updatedBooks: response.data.book,
          },
          "*"
        );
      }
    } else {
      console.error(response.data.message);
    }
  } catch (error) {
    console.error("Error decreasing book quantity:", error);
  }
}

async function increaseBookQuantity(book) {
  try {
    const response = await axios.post(`${API_URL}/increase`, {
      Название: book.Название,
    });

    if (response.data.success) {
      console.log("Book quantity increased:", response.data.book);

      const librarianWindow = window.opener;
      if (librarianWindow) {
        librarianWindow.postMessage(
          {
            type: "updateBookQuantity",
            bookTitle: book.Название,
            updatedBooks: response.data.book,
          },
          "*"
        );
      }
    } else {
      console.error(response.data.message);
    }
  } catch (error) {
    console.error("Error increasing book quantity:", error);
  }
}

function updateLibrarianBookDisplay(bookTitle) {
  //  Новая функция
  //  Отправляем  сообщение  в  окно  библиотекаря  об  изменении
  if (window.opener) {
    //  Проверяем, есть ли  открывающее  окно
    window.opener.postMessage({ type: "updateBookQuantity", bookTitle }, "*"); // Отправка названия книги как есть
  }
}
function validateEmail(email) {
  // Регулярное выражение для  проверки email
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
async function saveTakenBooks(userId, books) {
  try {
    await axios.post("/api/taken-books", {
      userId: userId,
      books: books,
    });
  } catch (error) {
    console.error("Ошибка сохранения данных о взятых книгах:", error);
  }
}

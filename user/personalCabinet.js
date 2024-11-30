// personalCabinet.js
axios.defaults.baseURL = "http://localhost:3000";

const BOOKS_KEY = "books";
const STUDENTS_KEY = "students"; //  Ключ для студентов
const TAKEN_BOOKS_KEY = "takenBooks"; //  Ключ для взятых книг

let studentEmail = null; // Объявляем studentEmail глобально
let currentUserId = null; // Объявляем currentUserId глобально

let bookToTake = null;
let isTakeModalOpen = false;

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
  handleSearchFormSubmit("searchForm", "searchInput", searchBook); // Для поиска книг
  console.log("Страница загружена. Инициализация...");
  console.log("Текущий URL:", window.location.href);

  const urlParams = getURLParams();
  console.log("URL Params:", urlParams);

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("JWT токен отсутствует. Редирект на страницу входа.");
    return;
  }

  try {
    const account = await getLoggedInAccount();
    console.log("Полученные данные аккаунта:", account);

    if (urlParams.id) {
      const studentId = parseInt(urlParams.id, 10);
      console.log("ID студента:", studentId);
      displayUserInfo({ name: urlParams.fio, group: urlParams.group });
      const searchForm = document.getElementById("searchForm");
      if (account.role === "user") {
        console.log("Роль пользователя - 'user'. Скрываем форму поиска.");
        searchForm.style.display = "none";
      } else {
        console.log("Роль пользователя - не 'user'. Показываем форму поиска.");
        searchForm.style.display = "block";
      }
      updateBooksTable();
    } else {
      console.log("Загружаем текущий аккаунт...");
      console.log("Account после получения данных:", account);

      if (!account) {
        throw new Error("Данные аккаунта не найдены.");
      }

      console.log("Текущий аккаунт:", account);
      displayUserInfo(account);
      loadTakenBooks(account.id); // This will trigger everything for you

      //updateBooksTable();
    }
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    showToast("Ошибка загрузки данных.");
  }
});
function handleSearchFormSubmit(formId, inputId, searchFunction) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);

  if (!form || !input) {
    console.error(`Form or input not found: ${formId}, ${inputId}`);
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // Отключаем стандартное поведение формы
    searchFunction(); // Вызываем переданную функцию поиска
  });

  input.addEventListener("input", () => {
    if (!input.value.trim()) {
      searchFunction(); // Обновляем таблицу при очистке поля поиска
    }
  });
}
document
  .getElementById("searchForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault(); // Предотвращаем стандартное поведение формы (перезагрузку страницы)

    const query = document
      .getElementById("searchInput")
      .value.trim()
      .toLowerCase();
    const books = await fetchBooks(query); // Выполняем запрос с учётом query
    displayBooks(books);

    // Обновляем margin
    const bookTable = document.getElementById("bookTable");
    updateControlsMargin(bookTable !== null);
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
    fio: params.get("fio"), //  Без проверки на undefined и decodeURIComponent
    group: params.get("group"), //  Без проверки на undefined и decodeURIComponent
    id: params.get("id"), //  Добавляем id
  };
}
async function displayUserInfo(account) {
  document.getElementById("user-name").textContent = account.name || "";
  document.getElementById("user-group").textContent = account.group || "";

  // Устанавливаем начальное значение задолженности
  const userDebtElement = document.getElementById("user-debt");
  userDebtElement.textContent = "Загрузка...";

  // Получаем ID студента из параметров URL
  const urlParams = getURLParams();
  const studentId = urlParams.id; // Получаем ID студента из URL параметров
  await updateUserDebtDisplay(studentId);
  displayUserBooks(studentId)
  console.log("Student ID:", studentId);


}
async function updateUserDebtDisplay(studentId) {
  const userDebtElement = document.getElementById("user-debt");
  userDebtElement.textContent = "Загрузка..."; // Устанавливаем начальное значение

  try {
    // Получаем токен из localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Токен отсутствует. Необходима авторизация.");
    }

    // Запрашиваем задолженность пользователя
    const response = await axios.get(`/api/user/${studentId}/debt`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const debtData = response.data;
    const totalDebt = debtData.debt_count || 0; // Предполагаем, что API возвращает количество задолженности

    // Обновляем текстовое содержимое элемента для задолженности
    userDebtElement.textContent =
      totalDebt > 0 ? `${totalDebt}` : "Нет задолженностей";
  } catch (error) {
    console.error("Ошибка при загрузке задолженности:", error);
    userDebtElement.textContent = "Ошибка загрузки";
  }
}

async function getLoggedInAccount() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const response = await axios.get("/api/auth/user-info", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Данные аккаунта:", response.data);
    return response.data.user;
  } catch (error) {
    console.error("Ошибка получения данных пользователя:", error);
    return null;
  }
}
async function loadUserBooks(userId) {
  try {
    const response = await axios.get(`/api/taken_books?userId=${userId}`);
    return response.data.books || []; // Возвращаем список книг для пользователя из базы данных
  } catch (error) {
    console.error("Ошибка загрузки данных о взятых книгах:", error);
    return [];
  }
}

async function returnBook(bookId, studentId) {
  try {
    await axios.delete(`/api/taken_books`, {
      data: { bookId, studentId },
    });

    showToast("Книга успешно возвращена.");
    location.reload();
  } catch (error) {
    console.error("Error returning book:", error);
    showToast("Ошибка возврата книги.");
  }
}

async function displayUserBooks(studentId) {
  const loggedInAccount = await getLoggedInAccount(); // Получаем данные о пользователе
  const isLibrarian =
    loggedInAccount &&
    (loggedInAccount.role === "librarian" || loggedInAccount.role === "admin");

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Необходима авторизация.");
    }

    // Запрос книг с сервера для данного студента
    const booksResponse = await axios.get(`/api/taken_books/student/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const books = booksResponse.data;
    console.log("Books data from server:", books); // Логирование данных с сервера

    if (!Array.isArray(books)) {
      throw new Error("Ответ от сервера не является массивом.");
    }

    const bookList = document.querySelector(".book-list");
    if (!bookList) {
      throw new Error("Элемент '.book-list' не найден.");
    }

    bookList.innerHTML = ""; // Очищаем список

    // Если книг нет
    if (books.length === 0) {
      const noBooksMessage = document.createElement("p");
      noBooksMessage.textContent = "Нет взятых книг";
      noBooksMessage.classList.add("no-books-message");
      bookList.appendChild(noBooksMessage);

      // Обновляем задолженность
      const userDebtElement = document.getElementById("user-debt");
      userDebtElement.textContent = "0";
      userDebtElement.style.color = "#41a0ff"; // Цвет для без задолженности
      return;
    }

    // Создание заголовков
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
      const returnHeader = document.createElement("span");
      returnHeader.classList.add("book-return-title");
      returnHeader.textContent = "Сдача";
      header.appendChild(returnHeader);
    }

    bookList.appendChild(header);

    // Добавляем каждую книгу в список
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
      bookDate.textContent = book.due_date; // Используем due_date

      const returnButtonContainer = document.createElement("div");
      if (isLibrarian) {
        const returnButton = document.createElement("button");
        returnButton.classList.add("book-return");
        returnButton.textContent = "Вернуть книгу";

        returnButton.style.backgroundColor = "#41a0ff"; // Цвет кнопки
        returnButton.style.border = "none";
        returnButton.style.color = "white";
        returnButton.style.padding = "8px 16px"; // Размер кнопки
        returnButton.style.fontSize = "16px"; // Размер шрифта кнопки
        returnButton.style.cursor = "pointer";

        returnButton.addEventListener("click", () => {
          openReturnModal(book); // Открываем модальное окно для возврата книги
        });

        returnButtonContainer.style.textAlign = "right";
        returnButtonContainer.appendChild(returnButton);
      }

      bookItem.appendChild(bookName);
      bookItem.appendChild(bookAuthor);
      bookItem.appendChild(bookDate);
      if (isLibrarian) {
        bookItem.appendChild(returnButtonContainer);
      }

      bookList.appendChild(bookItem);
    });

    // Обновляем задолженность
    let debtCount = books.length;
    const userDebtElement = document.getElementById("user-debt");
    userDebtElement.textContent = `${debtCount}`;
    userDebtElement.style.color = debtCount > 0 ? "#ea242e" : "#41a0ff";
  } catch (error) {
    console.error("Ошибка при отображении книг:", error);
    const bookList = document.querySelector(".book-list");
    bookList.innerHTML = `<p>Произошла ошибка при загрузке книг. Попробуйте позже.</p>`;
  }
}



// Функция для получения книг пользователя из базы данных
async function getUserBooksFromDB(studentId) {
  try {
    // Получаем список книг, уже взятых указанным студентом
    const takenBooksResponse = await axios.get(
      `/api/taken_books/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Ответ от сервера:", takenBooksResponse.data);

    const takenBooks = takenBooksResponse.data.map((book) => book.name); // Имена взятых книг
    console.log("Взятые книги:", takenBooks);
    return takenBooksResponse.data.books; // возвращаем список книг из ответа сервера
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
    const response = await axios.get(
      `/api/students/findByEmail?email=${email}`
    );

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
function clearPreviousResults() {
  // Удаляем таблицу книг (если она существует)
  const bookList = document.querySelector(".book-list");
  if (bookList) {
    bookList.innerHTML = ""; // Очищаем список книг
  }

  // Удаляем таблицу студентов (если она существует)
  const booksTable = document.getElementById("booksTable");
  if (booksTable) {
    booksTable.style.display = "none"; // Скрываем таблицу, а не удаляем
  }

  // Удаляем сообщения об отсутствии результатов (если есть)
  const resultContainer = document.getElementById("result");
  if (resultContainer) {
    resultContainer.innerHTML = ""; // Очищаем контейнер с результатами
  }

  // Скрываем сообщения о том, что ничего не найдено
  const messageContainer = document.getElementById("notFoundMessageContainer");
  if (messageContainer) {
    messageContainer.remove(); // Удаляем контейнер с сообщением
  }

  // Скрываем модальные окна (если они открыты)
  const takeBookModal = document.getElementById("takeBookModal");
  const returnBookModal = document.getElementById("returnBookModal");

  if (takeBookModal && takeBookModal.style.display !== "none") {
    takeBookModal.style.display = "none"; // Скрыть модальное окно для взятия книги
  }

  if (returnBookModal && returnBookModal.style.display !== "none") {
    returnBookModal.style.display = "none"; // Скрыть модальное окно для возврата книги
  }
}

async function searchBook() {
  clearPreviousResults(); // Очищаем предыдущие результаты поиска
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  const booksTable = document.getElementById("booksTable"); // Правильный ID таблицы
  const booksTableBody = document.getElementById("booksTableBody");
  const resultContainer = document.getElementById("result"); // Контейнер для сообщения
  const account = await getLoggedInAccount(); // Получаем информацию о текущем пользователе

  try {
    const books = await fetchBooks(query);
    console.log("Books from server:", books); // Добавьте эту строку для отладки
    // Всегда очищаем таблицу и resultContainer перед отображением результатов
    booksTableBody.innerHTML = "";
    resultContainer.innerHTML = "";
    if (books.length === 0) {
      // Если книги не найдены
      resultContainer.innerHTML = "<p>Книги не найдены</p>"; // Сообщение в resultContainer
      booksTable.style.display = "none"; // Скрываем таблицу
      resultContainer.style.display = "block"; // Показываем сообщение
    } else {
      resultContainer.innerHTML = ""; // Очищаем resultContainer, если книги найдены
      booksTable.style.display = "table"; // Показываем таблицу, если книги найдены
      resultContainer.style.display = "none"; // Скрываем сообщение

      displayBooks(books, account); // Отображаем найденные книги
    }

    // Обновляем margin в зависимости от наличия данных
    updateControlsMargin(books.length > 0);
  } catch (error) {
    console.error("Ошибка при поиске книг:", error);
    resultContainer.innerHTML =
      "<p>Ошибка при поиске книг. Попробуйте позже.</p>"; // Сообщение об ошибке
    booksTable.style.display = "none"; // Скрываем таблицу в случае ошибки
    resultContainer.style.display = "block"; // Показываем сообщение об ошибке

    // Обновляем margin в зависимости от наличия данных
    updateControlsMargin(false);
    if (error.response && error.response.status === 401) {
      showToast("Сессия истекла.  Пожалуйста, войдите снова.");

      logout();
    }
  }
}

// Функция для получения книг с сервера
async function fetchBooks(query = "") {
  try {
    const token = localStorage.getItem("token"); // Получаем токен из localStorage

    const response = await axios.get("/api/books", {
      params: { query },
      headers: {
        Authorization: `Bearer ${token}`, // Добавляем токен в заголовок
      },
    });
    return response.data;
  } catch (error) {
    // Обработка ошибок, если сервер вернет ошибку, даже с токеном
    console.error("Ошибка при получении книг:", error);

    if (error.response && error.response.status === 401) {
      showToast("Сессия истекла. Пожалуйста, войдите снова.");

      logout(); //  Вызываем функцию logout для перенаправления
    }

    throw error;
  }
}

// Функция для отображения списка книг
async function displayBooks(books) {
  const token = localStorage.getItem("token"); // Получаем токен

  if (!token) {
    alert("Необходима авторизация.");
    window.location.href = "/login"; // Перенаправление на страницу входа
    return;
  }

  // Получаем параметры URL
  const urlParams = getURLParams();
  console.log("URL Params:", urlParams);

  let studentId;

  if (urlParams.id) {
    studentId = parseInt(urlParams.id, 10);
    console.log("Student ID:", studentId);
  } else {
    alert("Не указан studentId в URL.");
    return;
  }

  // Получаем список книг, уже взятых указанным студентом
  const takenBooksResponse = await axios.get(
    `/api/taken_books/student/${studentId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  console.log("Ответ от сервера:", takenBooksResponse.data);

  const takenBooks = takenBooksResponse.data.map((book) => book.name); // Имена взятых книг
  console.log("Взятые книги:", takenBooks);
  // Сортируем книги по ID
  books.sort((a, b) => a[1].localeCompare(b[1]));
  // Сортируем книги по ID
  // books.sort((a, b) => a[0] - b[0]);

  const booksTableBody = document.getElementById("booksTableBody");
  booksTableBody.innerHTML = ""; // Очистка таблицы

  books.forEach((book) => {
    if (!Array.isArray(book)) {
      console.error("Invalid book data:", book);
      return; // Пропускаем некорректные данные
    }
    const row = booksTableBody.insertRow(); // Создаем строку

    // Заполняем ячейки строк
    const titleCell = row.insertCell();
    titleCell.textContent = book[1] || ""; // Название

    const authorCell = row.insertCell();
    authorCell.textContent = book[2] || ""; // Автор

    const quantityCell = row.insertCell();
    const quantity = book[3];
    quantityCell.textContent =
      quantity !== null && quantity !== undefined ? quantity : ""; // Количество, обработка null и undefined
    quantityCell.style.color = "rgb(102, 191, 102)";
    const locationCell = row.insertCell();
    locationCell.textContent = book[5] || ""; // Автор

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

    // Проверяем, есть ли книга в списке взятых
    if (takenBooks.includes(book[1])) {
      takeButton.disabled = true; // Отключаем кнопку
      takeButton.style.backgroundColor = "grey"; // Меняем цвет
      takeButton.textContent = "Уже взята"; // Текст кнопки
    } else {
      takeButton.addEventListener("click", () =>
        openTakeModal(book, studentId)
      ); // Передаем studentId в модальное окно
    }
    actionCell.appendChild(takeButton); // Добавляем кнопку "Взять книгу"
  });
}

// Функция для открытия модального окна
function openTakeModal(book) {
  if (isTakeModalOpen) {
    showToast("Вы уже пытаетесь взять книгу.");
    return;
  }
  bookToTake = book;
  document.getElementById(
    "takeBookMessage"
  ).textContent = `Вы уверены, что хотите взять книгу "${book[1]}"?`;
  document.getElementById("takeBookModal").style.display = "block";
  isTakeModalOpen = true; // Устанавливаем флаг
}

// Функция для закрытия модального окна
function closeTakeModal() {
  document.getElementById("takeBookModal").style.display = "none";
  isTakeModalOpen = false; // Устанавливаем флаг
}
function updateControlsMargin(isDataExist) {
  const controls = document.getElementById("controls");
  if (isDataExist) {
    controls.style.marginTop = "20px";
  } else {
    controls.style.marginTop = "200px";
  }
}
async function loadTakenBooks(userId) {
  try {
    const response = await axios.get(`/api/taken_books/${userId}`);

    const userTakenBooks = response.data; // Get  books list  AFTER

    displayUserInfo(account, response.data); // Get  books list AFTER, pass student id
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error("Сессия истекла.");
      showToast("Сессия истекла. Пожалуйста, войдите снова.");
      logout();
    }
    console.error("Ошибка при получении взятых книг:", error);
  }
}

// Функция для подтверждения взятия книги
async function confirmTakeBook() {
  const urlParams = getURLParams();
  console.log("URL Params:", urlParams);

  let studentId;

  // Получаем studentId из параметров URL
  if (urlParams.id) {
    studentId = parseInt(urlParams.id, 10);
    console.log("Student ID:", studentId);
  }

  if (!bookToTake) {
    showToast("Ошибка: книга не выбрана.");
    closeTakeModal();
    return;
  }

  if (!studentId) {
    showToast("Ошибка: текущий студент не определен.");
    closeTakeModal();
    return;
  }

  console.log("Объект bookToTake:", bookToTake);

  try {
    // Получаем токен из localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Ошибка авторизации. Войдите в систему.");
      closeTakeModal();
      return;
    }

    // Fetch available books and the user's current borrowed books from the DB
    const [booksResponse, takenBooksResponse] = await Promise.all([
      axios.get("/api/books", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`/api/taken_books/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const books = booksResponse.data;
    const userBooksData = takenBooksResponse.data;

    // Ищем книгу в библиотеке по названию, используя индексы
    const bookInLibrary = books.find(
      (b) => b[1] === bookToTake[1] // bookToTake[0] - это название книги
    );
    console.log(bookInLibrary);

    if (!bookInLibrary || bookInLibrary[3] === 0) {
      // bookInLibrary[2] - это ID книги, если количество равно 0
      showToast("Эта книга в данный момент отсутствует.");
      closeTakeModal();
      return;
    }

    // Проверяем, взял ли студент уже эту книгу
    const bookAlreadyTaken = await checkIfBookTaken(
      studentId,
      bookToTake[1],
      token
    );
    if (bookAlreadyTaken) {
      showToast("Вы уже взяли эту книгу!");
      closeTakeModal();
      return;
    }

    // Рассчитываем дату возврата книги
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const formattedDueDate = dueDate.toISOString().split("T")[0]; // ISO формат даты

    // Добавляем книгу в список взятых книг студента
    userBooksData.books.push({
      id: bookInLibrary[0], // ID книги
      name: bookToTake[1], // Название книги
      author: bookToTake[2], // Автор книги
      dueDate: formattedDueDate, // Дата возврата
    });

    // Удаляем некорректные данные
    userBooksData.books = userBooksData.books.filter(
      (book) => book.name && book.author && book.dueDate
    );

    if (userBooksData.books.length === 0) {
      showToast("Нет корректных данных для отправки.");
      return;
    }

    // Отправляем обновленные данные о взятых книгах на сервер
    console.log("Отправка данных на сервер:", userBooksData);
    const response = await axios.post(
      `/api/taken_books/${studentId}`,
      userBooksData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Ответ сервера:", response.data);

    // Уменьшаем количество книги в библиотеке
    bookInLibrary[3]--; // Уменьшаем количество книги
    console.log("Обновление количества книг:", bookInLibrary);

    try {
      // Логируем данные перед отправкой запроса
      console.log(
        "Отправка запроса на обновление книги. Данные:",
        bookInLibrary
      );

      // Отправляем PUT-запрос для обновления данных о книге
      const bookResponse = await axios.post(
        `/api/books/${bookInLibrary[0]}`, // ID книги, который мы передаем
        bookInLibrary, // Данные о книге
        {
          headers: { Authorization: `Bearer ${token}` }, // Добавляем токен авторизации
        }
      );

      // Логируем успешный ответ
      console.log("Ответ сервера при обновлении книги:", bookResponse.data);
    } catch (error) {
      // Логируем ошибку, если что-то пошло не так
      console.error("Ошибка при обновлении книги:", error);

      // Дополнительный вывод ошибок
      if (error.response) {
        // Сервер вернул ответ с ошибкой
        console.error("Ответ от сервера:", error.response.data);
        console.error("Статус ответа:", error.response.status);
      } else if (error.request) {
        // Запрос был отправлен, но ответа не было
        console.error(
          "Запрос был отправлен, но не получен ответ:",
          error.request
        );
      } else {
        // Ошибка при настройке запроса
        console.error("Ошибка настройки запроса:", error.message);
      }
    }

    // Обновляем UI
    // displayUserBooks(userBooksData.books);
    updateBooksTable();

    showToast(`Книга "${bookToTake[1]}" успешно взята.`);
    closeTakeModal();
    bookToTake = null;
  } catch (error) {
    console.error(
      "Ошибка при подтверждении взятия книги:",
      error.response?.data || error.message
    );
    showToast("Произошла ошибка при взятии книги.");
    closeTakeModal();
  }
}

async function checkIfBookTaken(studentId, bookTitle, token) {
  try {
    const response = await axios.post(
      "/api/check_if_book_taken",
      {
        student_id: studentId,
        book_title: bookTitle,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.success;
  } catch (error) {
    console.error("Ошибка при проверке взятия книги:", error);
    return false;
  }
}

// Привязываем событие к кнопке подтверждения
document
  .getElementById("confirmTakeBtn")
  .addEventListener("click", confirmTakeBook);

// Привязываем событие к кнопке подтверждения
document
  .getElementById("confirmTakeBtn")
  .addEventListener("click", confirmTakeBook);

// Функция для добавления книги к списку взятых
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
  try {
    const token = localStorage.getItem("token"); // Получаем токен

    if (!token) {
      alert("Необходима авторизация.");
      window.location.href = "/login"; // Перенаправление на страницу входа
      return;
    }

    // Получаем параметры URL
    const urlParams = getURLParams();
    console.log("URL Params:", urlParams);

    let studentId;

    if (urlParams.id) {
      studentId = parseInt(urlParams.id, 10);
      console.log("Student ID:", studentId);
    } else {
      alert("Не указан studentId в URL.");
      return;
    }

    // Получаем список всех книг
    const booksResponse = await axios.get("/api/books", {
      headers: { Authorization: `Bearer ${token}` },
    });
    let books = booksResponse.data;

    // Получаем список книг, уже взятых указанным студентом
    const takenBooksResponse = await axios.get(
      `/api/taken_books/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Ответ от сервера:", takenBooksResponse.data);

    const takenBooks = takenBooksResponse.data.map((book) => book.name); // Имена взятых книг
    console.log("Взятые книги:", takenBooks);

    // Сортируем книги по ID
    books.sort((a, b) => a[1].localeCompare(b[1]));

    const booksTableBody = document.getElementById("booksTableBody");
    booksTableBody.innerHTML = ""; // Очистка таблицы

    // Заголовки таблицы
    const tableHeader = document.getElementById("booksTableHeader");
    tableHeader.innerHTML = ""; // Очистка заголовков

    const headers = [
      "Название",
      "Автор",
      "Количество",
      "Местоположение",
      "Действие",
    ];
    const headerRow = document.createElement("tr");

    headers.forEach((header) => {
      const headerCell = document.createElement("th");
      headerCell.textContent = header;
      headerRow.appendChild(headerCell);
    });

    tableHeader.appendChild(headerRow); // Добавляем строку с заголовками в таблицу

    books.forEach((book) => {
      if (book[3] === 0) return; // Пропускаем книги с нулевым количеством

      const row = document.createElement("tr");

      const nameCell = row.insertCell();
      nameCell.textContent = book[1]; // Название книги

      const authorCell = row.insertCell();
      authorCell.textContent = book[2]; // Автор

      const quantityCell = row.insertCell();
      quantityCell.textContent = book[3]; // Количество
      quantityCell.style.color =
        book[3] > 5 ? "rgb(102, 191, 102)" : "rgb(255, 94, 94)"; // Цвет в зависимости от количества

      const locationCell = row.insertCell();
      locationCell.textContent = book[5]; // Полка

      const actionCell = row.insertCell();
      actionCell.style.display = "flex";
      actionCell.style.justifyContent = "center";
      actionCell.style.alignItems = "center";

      // Кнопка для взятия книги
      const takeButton = document.createElement("button");
      takeButton.classList.add("action-button");
      takeButton.textContent = "Взять книгу";
      takeButton.style.backgroundColor = "rgb(41, 128, 185)";
      takeButton.style.color = "white";
      takeButton.style.border = "none";
      takeButton.style.padding = "8px 16px";
      takeButton.style.borderRadius = "10px";
      takeButton.style.fontFamily = "Montserrat, sans-serif";

      // Проверяем, есть ли книга в списке взятых
      if (takenBooks.includes(book[1])) {
        takeButton.disabled = true; // Отключаем кнопку
        takeButton.style.backgroundColor = "grey"; // Меняем цвет
        takeButton.textContent = "Уже взята"; // Текст кнопки
      } else {
        takeButton.addEventListener("click", () =>
          openTakeModal(book, studentId)
        ); // Передаем studentId в модальное окно
      }

      actionCell.appendChild(takeButton);
      row.appendChild(nameCell);
      row.appendChild(authorCell);
      row.appendChild(quantityCell);
      row.appendChild(locationCell);
      row.appendChild(actionCell);

      booksTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Ошибка при обновлении таблицы книг:", error);
    if (error.response && error.response.status === 401) {
      alert("Сессия истекла. Пожалуйста, выполните вход снова.");
      window.location.href = "/login"; // Перенаправление на страницу входа
    } else {
      alert(
        "Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже."
      );
    }
  }
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
    await axios.post("/api/taken_books", {
      userId: userId,
      books: books,
    });
  } catch (error) {
    console.error("Ошибка сохранения данных о взятых книгах:", error);
  }
}

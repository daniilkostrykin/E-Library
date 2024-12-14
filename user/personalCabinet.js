axios.defaults.baseURL = "http://localhost:3000";

let studentId;
let bookToTake = null;
let isTakeModalOpen = false;
let bookToReturn = null;
let isReturnModalOpen = false;

function goToLibrary() {
  window.location.href = "../library/library.html";
}
function logout() {
  localStorage.removeItem("token");

  localStorage.removeItem("loggedInEmail");

  window.location.href = "../index.html";

  console.log("Logged out and redirected to index.html");
}
document.addEventListener("DOMContentLoaded", async () => {
  handleSearchFormSubmit("searchForm", "searchInput", searchBook); 
  console.log("Страница загружена. Инициализация...");
  console.log("Текущий URL:", window.location.href);

  const urlParams = getURLParams();
  console.log("URL Params:", urlParams);

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("JWT токен отсутствует. Редирект на страницу входа.");
    return;
  }
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("find");

  searchButton.textContent = "Показать книги";


  searchInput.addEventListener("input", () => {
    searchButton.textContent = searchInput.value.trim()
      ? "Найти"
      : "Показать книги";
  });
  searchButton.addEventListener("click", () => {
    searchBook();
  });

  try {
    const account = await getLoggedInAccount();
    console.log("Полученные данные аккаунта:", account);

    if (urlParams.id) {
      studentId = parseInt(urlParams.id, 10);
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
      loadTakenBooks(account.id); 

      const searchButton = document.getElementById("find");
      if (searchButton) {
        console.log("Success");
      }
      const searchInput = document.getElementById("searchInput");

 
      searchButton.textContent = "Показать книги";

      searchInput.addEventListener("input", () => {
        if (searchInput.value.trim() !== "") {
          searchButton.textContent = "Найти";
        } else {
          searchButton.textContent = "Показать книги";
        }
      });
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      showToast("Сессия истекла. Пожалуйста, войдите снова.");
      logout();
    } else {
      console.error("Ошибка при загрузке данных:", error);
      showToast("Ошибка загрузки данных.");
    }
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
    event.preventDefault(); 
    searchFunction();
  });

  input.addEventListener("input", () => {
    if (!input.value.trim()) {
      searchFunction(); 
    }
  });
}

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
    fio: params.get("fio"),
    group: params.get("group"),
    id: params.get("id"), 
  };
}
async function displayUserInfo(account) {
  document.getElementById("user-name").textContent = account.name || "";
  document.getElementById("user-group").textContent = account.group || "";

  const userDebtElement = document.getElementById("user-debt");
  userDebtElement.textContent = "Загрузка...";

  const urlParams = getURLParams();
  const studentId = urlParams.id; 
  await updateUserDebtDisplay(studentId);
  displayUserBooks(studentId);
  console.log("Student ID:", studentId);
}
async function updateUserDebtDisplay(studentId) {
  const userDebtElement = document.getElementById("user-debt");
  userDebtElement.textContent = "Загрузка..."; 

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Токен отсутствует. Необходима авторизация.");
    }

    const response = await axios.get(`/api/user/${studentId}/debt`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const debtData = response.data;
    const totalDebt = debtData.debt_count || 0; 

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
    return response.data.books || []; 
  } catch (error) {
    console.error("Ошибка загрузки данных о взятых книгах:", error);
    return [];
  }
}

async function displayUserBooks(studentId) {
  const loggedInAccount = await getLoggedInAccount();
  const isLibrarian =
    loggedInAccount &&
    (loggedInAccount.role === "librarian" || loggedInAccount.role === "admin");

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Необходима авторизация.");
    }

    const booksResponse = await axios.get(
      `/api/taken_books/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const books = booksResponse.data;
    console.log("Books data from server:", books);

    if (!Array.isArray(books)) {
      throw new Error("Ответ от сервера не является массивом.");
    }

    const bookList = document.querySelector(".book-list");
    if (!bookList) {
      throw new Error("Элемент '.book-list' не найден.");
    }

    bookList.innerHTML = ""; 

    if (books.length === 0) {
      const noBooksMessage = document.createElement("p");
      noBooksMessage.textContent = "Нет взятых книг";
      noBooksMessage.classList.add("no-books-message");
      bookList.appendChild(noBooksMessage);

      const userDebtElement = document.getElementById("user-debt");
      userDebtElement.textContent = "0";
      userDebtElement.style.color = "#41a0ff"; 
      return;
    }

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
      bookDate.textContent = book.due_date;

      const returnButtonContainer = document.createElement("div");
      if (isLibrarian) {
        const returnButton = document.createElement("button");
        returnButton.classList.add("book-return");
        returnButton.textContent = "Вернуть книгу";

        returnButton.style.backgroundColor = " #41a0ff";
        returnButton.style.border = "none";
        returnButton.style.color = "white";
        returnButton.style.padding = "8px 16px";
        returnButton.style.textAlign = "center";
        returnButton.style.textDecoration = "none";
        returnButton.style.display = "inline-block";
        returnButton.style.fontSize = "16px";
        returnButton.style.margin = "0 2px";
        returnButton.style.cursor = "pointer";

        returnButton.addEventListener("click", () => {
          console.log("Возвращаем книгу:", book);
          openReturnModal(book);
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

async function getUserBooksFromDB(studentId) {
  try {
    const takenBooksResponse = await axios.get(
      `/api/taken_books/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Ответ от сервера:", takenBooksResponse.data);

    const takenBooks = takenBooksResponse.data.map((book) => book.name);
    console.log("Взятые книги:", takenBooks);
    return takenBooksResponse.data.books;
  } catch (error) {
    console.error("Ошибка при получении взятых книг:", error);
    return [];
  }
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
document
  .getElementById("confirmTakeBtn")
  .addEventListener("click", confirmTakeBook);
document
  .getElementById("confirmReturnBtn")
  .addEventListener("click", confirmReturnBook);

function openTakeModal(book) {
  if (isTakeModalOpen) {
    showToast("Вы уже пытаетесь выдать книгу.");
    return;
  }
  bookToTake = book;
  document.getElementById(
    "takeBookMessage"
  ).textContent = `Вы уверены, что хотите выдать книгу "${book[1]}"?`;
  document.getElementById("takeBookModal").style.display = "block";
  isTakeModalOpen = true;
}
async function confirmTakeBook() {
  const urlParams = getURLParams();
  console.log("URL Params:", urlParams);

  let studentId;

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
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Ошибка авторизации. Войдите в систему.");
      closeTakeModal();
      return;
    }

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

    const bookInLibrary = books.find(
      (b) => b[1] === bookToTake[1]
    );
    console.log(bookInLibrary);

    if (!bookInLibrary || bookInLibrary[3] === 0) {
      showToast("Эта книга в данный момент отсутствует.");
      closeTakeModal();
      return;
    }

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

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const formattedDueDate = dueDate.toISOString().split("T")[0];

    userBooksData.books.push({
      id: bookInLibrary[0],
      name: bookToTake[1],
      author: bookToTake[2],
      dueDate: formattedDueDate,
    });

    userBooksData.books = userBooksData.books.filter(
      (book) => book.name && book.author && book.dueDate
    );

    if (userBooksData.books.length === 0) {
      showToast("Нет корректных данных для отправки.");
      return;
    }

    console.log("Отправка данных на сервер:", userBooksData);
    const response = await axios.post(
      `/api/taken_books/${studentId}`,
      userBooksData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Ответ сервера:", response.data);

    bookInLibrary[3]--;
    console.log("Обновление количества книг:", bookInLibrary);

    try {
      console.log(
        "Отправка запроса на обновление книги. Данные:",
        bookInLibrary
      );

      const bookResponse = await axios.post(
        `/api/books/${bookInLibrary[0]}`,
        bookInLibrary,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Ответ сервера при обновлении книги:", bookResponse.data);
    } catch (error) {
      console.error("Ошибка при обновлении книги:", error);

      if (error.response) {
        console.error("Ответ от сервера:", error.response.data);
        console.error("Статус ответа:", error.response.status);
      } else if (error.request) {
        console.error(
          "Запрос был отправлен, но не получен ответ:",
          error.request
        );
      } else {
        console.error("Ошибка настройки запроса:", error.message);
      }
    }

    console.log(studentId);
    const bookList = document.querySelector(".book-list");
    bookList.style.display = "block";
    if (!bookList) {
      throw new Error("Элемент '.book-list' не найден.");
    }
    await displayUserBooks(studentId);
    updateBooksTable();
    updateUserDebtDisplay(studentId);

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
function closeTakeModal() {
  document.getElementById("takeBookModal").style.display = "none";
  isTakeModalOpen = false;
}
function openReturnModal(book) {
  console.log("Book object in openReturnModal:", book);
  console.log("Открытие модального окна для книги:", book);
  if (isReturnModalOpen) {
    showToast("Вы уже пытаетесь вернуть книгу.");
    return;
  }
  bookToReturn = book;
  console.log("bookToReturn in openReturnModal: ", bookToReturn);
  document.getElementById(
    "returnBookMessage"
  ).textContent = `Вы уверены, что хотите вернуть книгу "${book.name}"?`;
  document.getElementById("returnBookModal").style.display = "block";
  isReturnModalOpen = true;
}
async function confirmReturnBook() {
  if (!bookToReturn) {
    showToast("Ошибка: книга не выбрана.");
    closeReturnModal();
    return;
  }

  const bookName = bookToReturn.name;

  const urlParams = getURLParams();
  const studentIdFromUrl = parseInt(urlParams.id, 10);

  const loggedInAccount = await getLoggedInAccount();
  const studentId = studentIdFromUrl || loggedInAccount.id;
  console.log("StudentId в confirmReturnBook:", studentId);
  if (!studentId) {
    showToast("Ошибка: studentId не определен.");
    closeReturnModal();
    return;
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Необходима авторизация.");
      window.location.href = "/login";
      return;
    }
    const response = await axios.post(
      "/api/taken_books/return",
      {
        bookName: bookName,
        studentId: studentId,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Ответ сервера в confirmReturnBook:", response.data);

    if (response.data.success) {
      showToast("Книга успешно возвращена.");
      closeReturnModal();
      displayUserBooks(studentId);
      updateBooksTable();
    } else {
      showToast(response.data.message);
    }
  } catch (error) {
    console.error("Error returning book:", error);
    showToast("Ошибка возврата книги.");
  }
}

function closeReturnModal() {
  document.getElementById("returnBookModal").style.display = "none";
  isReturnModalOpen = false;
}
async function getStudentIdByEmail(email) {
  try {
    const response = await axios.get(
      `/api/students/findByEmail?email=${email}`
    );

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
      updateBooksTable(response.data);
    } catch (error) {
      console.error("Error fetching books:", error);
      showToast("Ошибка поиска книг.");
    }
  });
}
function clearPreviousResults() {

  const booksTable = document.getElementById("booksTable");
  if (booksTable) {
    booksTable.style.display = "none";
  }

  const resultContainer = document.getElementById("result");
  if (resultContainer) {
    resultContainer.innerHTML = "";
  }

  const messageContainer = document.getElementById("notFoundMessageContainer");
  if (messageContainer) {
    messageContainer.remove();
  }

  const takeBookModal = document.getElementById("takeBookModal");
  const returnBookModal = document.getElementById("returnBookModal");

  if (takeBookModal && takeBookModal.style.display !== "none") {
    takeBookModal.style.display = "none";
  }

  if (returnBookModal && returnBookModal.style.display !== "none") {
    returnBookModal.style.display = "none";
  }
}

async function searchBook() {
  clearPreviousResults();
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  const booksTable = document.getElementById("booksTable");
  const booksTableBody = document.getElementById("booksTableBody");
  const resultContainer = document.getElementById("result");
  const account = await getLoggedInAccount();

  try {
    const books = query === "" ? await fetchBooks() : await fetchBooks(query);

    console.log("Books received:", books);

    booksTableBody.innerHTML = "";
    resultContainer.innerHTML = "";
    if (books.length === 0) {
      resultContainer.innerHTML = "<p>Книги не найдены</p>";
      booksTable.style.display = "none";
      resultContainer.style.display = "block";
    } else {
      updateBooksTable(books);
      booksTable.style.display = "table";
      resultContainer.style.display = "none";
    }
    controls.style.marginTop = "20px";
  } catch (error) {
    console.error("Ошибка при поиске книг:", error);
    resultContainer.innerHTML =
      "<p>Ошибка при поиске книг. Попробуйте позже.</p>";
    booksTable.style.display = "none";
    resultContainer.style.display = "block";

    if (error.response && error.response.status === 401) {
      showToast("Сессия истекла. Пожалуйста, войдите снова.");
      logout();
    }
  }
}

async function fetchBooks(query = "") {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.get("/api/books", {
      params: { query },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении книг:", error);

    if (error.response && error.response.status === 401) {
      showToast("Сессия истекла. Пожалуйста, войдите снова.");

      logout();
    }

    throw error;
  }
}

async function displayBooks(books) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Необходима авторизация.");
    window.location.href = "/login";
    return;
  }

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

  const takenBooksResponse = await axios.get(
    `/api/taken_books/student/${studentId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  console.log("Ответ от сервера:", takenBooksResponse.data);

  const takenBooks = takenBooksResponse.data.map((book) => book.name);
  console.log("Взятые книги:", takenBooks);
  books.sort((a, b) => a[1].localeCompare(b[1]));

  const booksTableBody = document.getElementById("booksTableBody");
  booksTableBody.innerHTML = "";

  books.forEach((book) => {
    if (!Array.isArray(book)) {
      console.error("Invalid book data:", book);
      return;
    }
    const row = booksTableBody.insertRow();

    const titleCell = row.insertCell();
    titleCell.textContent = book[1] || "";

    const authorCell = row.insertCell();
    authorCell.textContent = book[2] || "";

    const quantityCell = row.insertCell();
    const quantity = book[3];
    quantityCell.textContent =
      quantity !== null && quantity !== undefined ? quantity : "";
    quantityCell.style.color = "rgb(102, 191, 102)";
    const locationCell = row.insertCell();
    locationCell.textContent = book[5] || "";

    const actionCell = row.insertCell();
    actionCell.style.display = "flex";
    actionCell.style.justifyContent = "center";
    actionCell.style.alignItems = "center";

    const takeButton = document.createElement("button");
    takeButton.textContent = "Выдать книгу";
    takeButton.style.backgroundColor = "rgb(41, 128, 185)";
    takeButton.style.color = "white";
    takeButton.style.border = "none";
    takeButton.style.padding = "8px 16px";
    takeButton.style.borderRadius = "10px";
    takeButton.style.fontFamily = "Montserrat, sans-serif";

    if (takenBooks.includes(book[1])) {
      takeButton.disabled = true;
      takeButton.style.backgroundColor = "grey";
      takeButton.textContent = "Уже взята";
    } else {
      takeButton.addEventListener("click", () =>
        openTakeModal(book, studentId)
      );
    }
    actionCell.appendChild(takeButton);
  });
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

    const userTakenBooks = response.data;

    displayUserInfo(account, response.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error("Сессия истекла.");
      showToast("Сессия истекла. Пожалуйста, войдите снова.");
      logout();
    }
    console.error("Ошибка при получении взятых книг:", error);
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

function removeBookRow(book) {
  const rows = document
    .getElementById("booksTableBody")
    .getElementsByTagName("tr");

  for (let row of rows) {
    const cells = row.getElementsByTagName("td");
    const bookTitle = cells[0].textContent.trim();

    if (bookTitle === book["Название"]) {
      row.remove();
      break;
    }
  }
}

async function updateBooksTable(books) {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Необходима авторизация.");
      window.location.href = "/login";
      return;
    }

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

    if (!books) {
      const booksResponse = await axios.get("/api/books", {
        headers: { Authorization: `Bearer ${token}` },
      });

      books = booksResponse.data;
    }

    const takenBooksResponse = await axios.get(
      `/api/taken_books/student/${studentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Ответ от сервера:", takenBooksResponse.data);

    const takenBooks = takenBooksResponse.data.map((book) => book.name);
    console.log("Взятые книги:", takenBooks);

    books.sort((a, b) => a[1].localeCompare(b[1]));

    const booksTableBody = document.getElementById("booksTableBody");
    booksTableBody.innerHTML = "";

    const tableHeader = document.getElementById("booksTableHeader");
    tableHeader.innerHTML = "";

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

    tableHeader.appendChild(headerRow);

    books.forEach((book) => {
      if (book[3] === 0) return;

      const row = document.createElement("tr");

      const nameCell = row.insertCell();
      nameCell.textContent = book[1];

      const authorCell = row.insertCell();
      authorCell.textContent = book[2];

      const quantityCell = row.insertCell();
      quantityCell.textContent = book[3];
      quantityCell.style.color =
        book[3] > 5 ? "rgb(102, 191, 102)" : "rgb(255, 94, 94)";

      const locationCell = row.insertCell();
      locationCell.textContent = book[5];

      const actionCell = row.insertCell();
      actionCell.style.display = "flex";
      actionCell.style.justifyContent = "center";
      actionCell.style.alignItems = "center";

      const takeButton = document.createElement("button");
      takeButton.classList.add("action-button");
      takeButton.textContent = "Выдать книгу";
      takeButton.style.backgroundColor = "rgb(41, 128, 185)";
      takeButton.style.color = "white";
      takeButton.style.border = "none";
      takeButton.style.padding = "8px 16px";
      takeButton.style.borderRadius = "10px";
      takeButton.style.fontFamily = "Montserrat, sans-serif";

      if (takenBooks.includes(book[1])) {
        takeButton.disabled = true;
        takeButton.style.backgroundColor = "grey";
        takeButton.textContent = "Уже взята";
      } else {
        takeButton.addEventListener("click", () =>
          openTakeModal(book, studentId)
        );
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
      window.location.href = "/login";
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
  if (window.opener) {
    window.opener.postMessage({ type: "updateBookQuantity", bookTitle }, "*");
  }
}
function validateEmail(email) {
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

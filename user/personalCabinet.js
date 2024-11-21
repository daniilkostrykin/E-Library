// personalCabinet.js
const BOOKS_KEY = "books";
const STUDENTS_KEY = "students"; //  Ключ для студентов
const TAKEN_BOOKS_KEY = "takenBooks"; //  Ключ для взятых книг
function goToLibrary() {
  window.location.href = "../library/library.html";
}
/*
document.addEventListener("DOMContentLoaded", () => {
  const account = getLoggedInAccount();

  displayUserInfo(account);

  searchBookSetup(); // Инициализация поиска
});*/
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
          showToast("Студент с  указанным ID не  найден.");

          return; //  Прерываем выполнение, если  студент не найден
        }
      } catch (error) {
        console.error("Error  parsing students  data:", error);
        showToast("Ошибка  загрузки данных студентов. Данные  повреждены.");

        return;
      }
    } else {
      console.warn(
        "No  students found  in LocalStorage  using key",
        STUDENTS_KEY
      );
      showToast("Данные студентов отсутствуют  в LocalStorage.");
      return;
    }
  } else {
    // Если id  нет,  загружаем  текущий вошедший  аккаунт

    account = getLoggedInAccount();

    // console.log("Загружен текущий аккаунт:", account)
  }
  const searchForm = document.getElementById("searchForm"); //  ID вашей формы поиска

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault(); //  Предотвращаем перезагрузку
    searchBook(); // Вызываем вашу функцию поиска
  });

  if (account) {
    console.log("Account  found:", account);

    displayUserInfo(account); //  Отображаем данные  пользователя

    searchBookSetup(); // Инициализация  поиска

    document.querySelector(".book-list").style.display = "block"; // Отображаем  список  книг

    document.getElementById("goToLibrary").style.display = "block";

    document.getElementById("logout").style.display = "block";
  } else {
    console.error("Не удалось  загрузить  данные аккаунта.");

    showToast("Не  удалось загрузить данные аккаунта.");

    if (!urlParams.fio && !urlParams.group && !urlParams.id) {
      console.warn("Редирект  на главную страницу.");
      window.location.href = "../index.html";
    }
  }
});
function displayUserInfo(user) {
  console.log("user", user);
  if (user) {
    document.getElementById("user-name").textContent = user.ФИО || user.name; // Используем ФИО, если есть, иначе name
    document.getElementById("user-group").textContent =
      user.Группа || user.group; // Используем Группа, если есть, иначе group

    const userPhoto =
      user.Фото || (user.photo ? user.photo : "/assets/dima.jpg");
    document.getElementById("user-photo").src = userPhoto;

    const userBooks = loadUserBooks(user.id); // везде используем id
    displayUserBooks(userBooks);
  } else {
    // Обработка случая, когда пользователь не найден (например, после выхода)
    // Возможно, редирект на страницу входа или отображение сообщения об ошибке
    console.warn("displayUserInfo вызван с пустым объектом user.");
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

  console.log("userId в loadUserBooks:", userId, typeof userId);

  console.log("takenBooks  в loadUserBooks:", takenBooks); //  Проверьте  структуру takenBooks

  return userBookData ? userBookData.books : [];
}

function returnBook(book) {
  const studentId = parseInt(localStorage.getItem("currentStudentId"), 10);

  if (!studentId) return;

  let takenBooks = JSON.parse(localStorage.getItem(TAKEN_BOOKS_KEY)) || [];

  let userBooks = takenBooks.find((item) => item.userId === studentId);

  if (!userBooks) return;

  userBooks.books = userBooks.books.filter((b) => b.name !== book.name); // Удаляем книгу из задолженностей

  saveTakenBooksToLocalStorage(takenBooks);
  increaseBookQuantity(book);

  // alert(`Книга  "${book.name}"  успешно возвращена.`);
  displayUserBooks(userBooks.books); // Обновляем  отображение задолженностей
}

function displayUserBooks(books) {
  const loggedInAccount = getLoggedInAccount();
  const isLibrarian =
    loggedInAccount &&
    (loggedInAccount.role === "librarian" || loggedInAccount.role === "admin");
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
    //  Если библиотекарь, добавляем заголовок "Сдача"
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
      returnButton.style.padding = "8px 16px"; //  Увеличил padding для  кнопки
      returnButton.style.textAlign = "center";
      returnButton.style.textDecoration = "none";
      returnButton.style.display = "inline-block";
      returnButton.style.fontSize = "16px"; // Увеличил  размер  шрифта
      returnButton.style.margin = "0 2px"; // Добавил margin
      returnButton.style.cursor = "pointer"; //  Указатель  мыши  при  наведении

      returnButton.addEventListener("click", () => {
        //  if (confirm(`Вы уверены, что хотите вернуть книгу "${book.name}"?`)) {
        console.log("Клик на кнопку");
        openReturnModal(book);
        //   updateLibrarianBookDisplay(book.name); //  Вызываем  функцию  для  обновления  таблицы  книг
        /*  displayUserBooks(
          loadUserBooks(parseInt(localStorage.getItem("currentStudentId"), 10))
        ); // закомментируйте, если хотите перезапускать updateBookTable*/
      });

      returnButtonContainer.style.textAlign = "right"; // Выравнивание  по  правому  краю

      returnButtonContainer.appendChild(returnButton);
    }
    bookItem.appendChild(bookName);
    bookItem.appendChild(bookAuthor);
    bookItem.appendChild(bookDate);
    if (isLibrarian) {
      bookItem.appendChild(returnButtonContainer); //  Добавляем контейнер  с кнопкой
    }
    bookList.appendChild(bookItem);
  });

  // Обновляем задолженности
  let debtCount = books.length;
  const userDebtElement = document.getElementById("user-debt");
  userDebtElement.textContent = `${debtCount}`;
  userDebtElement.style.color = debtCount > 0 ? "#ea242e" : "#41a0ff";
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

// Функция для подтверждения взятия книги
function confirmReturnBook() {
  console.log("Клик на кнопку confirm");

  if (bookToReturn) {
    const studentId = parseInt(localStorage.getItem("currentStudentId"), 10);

    if (!studentId) {
      showToast("Ошибка: текущий студент не определен.");
      closeReturnModal();
      return;
    }

    // Загружаем список всех взятых книг
    const takenBooks = JSON.parse(localStorage.getItem(TAKEN_BOOKS_KEY)) || [];
    const userBooksData = takenBooks.find((item) => item.userId === studentId);

    if (!userBooksData) {
      showToast("У вас нет взятых книг.");
      closeReturnModal();
      return;
    }

    // Ищем книгу в списке пользователя
    const bookIndex = userBooksData.books.findIndex(
      (b) => b.name === bookToReturn.name
    );

    if (bookIndex === -1) {
      showToast("У вас нет этой книги.");
      closeReturnModal();
      return;
    }

    // Удаляем книгу из списка пользователя
    userBooksData.books.splice(bookIndex, 1);

    // Если пользователь больше не имеет книг, удаляем его запись из takenBooks
    if (userBooksData.books.length === 0) {
      const userIndex = takenBooks.findIndex(
        (item) => item.userId === studentId
      );
      takenBooks.splice(userIndex, 1);
    }

    // Сохраняем изменения в takenBooks
    localStorage.setItem(TAKEN_BOOKS_KEY, JSON.stringify(takenBooks));

    // Возвращаем книгу в библиотеку
    const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
    const bookInLibrary = books.find(
      (b) => b["Название"] === bookToReturn.name
    );

    if (bookInLibrary) {
      bookInLibrary["Количество"]++;
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    }

    // Обновляем отображение списка книг пользователя
    const updatedUserBooks =
      userBooksData && userBooksData.books ? userBooksData.books : [];
    displayUserBooks(updatedUserBooks);

    // Показываем сообщение об успешном возврате
    showToast(`Книга "${bookToReturn.name}" успешно возвращена.`);
    closeReturnModal();
    bookToReturn = null;
    updateBooksTable();
  } else {
    showToast("Ошибка: книга не выбрана.");
    closeReturnModal();
  }
}

document
  .getElementById("confirmReturnBtn")
  .addEventListener("click", confirmReturnBook);

function searchBookSetup() {
  //Инициализация функции

  const account = getLoggedInAccount();
  const findButton = document.getElementById("find");

  if (account && (account.role === "admin" || account.role === "librarian")) {
    findButton.style.display = "block"; // Показываем кнопку поиска для админа/библиотекаря
    document.getElementById("searchForm").style.display = "flex";

    findButton.addEventListener("click", searchBook);
  } else {
    // Для обычного пользователя поиск скрыт
    document.getElementById("searchForm").style.display = "none";
    document.getElementById("booksTable").style.display = "none";

    findButton.removeEventListener("click", searchBook);
  }
}

function searchBook() {
  document.getElementById("booksTable").style.display = "none"; // изначально  скрываем  таблицу
  const searchInput = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  const booksTable = document.getElementById("booksTable");
  const resultContainer = document.getElementById("result");
  const booksTableBody = document.getElementById("booksTableBody");

  booksTableBody.innerHTML = "";

  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];

  const filteredBooks = books.filter(
    (book) =>
      book.Количество > 0 && // Исключаем книги с количеством 0
      (book.Название.toLowerCase().includes(searchInput) ||
        book.Автор.toLowerCase().includes(searchInput) ||
        String(book.Количество).includes(searchInput))
  );

  if (filteredBooks.length === 0) {
    resultContainer.innerHTML = "<p>Книги не найдены</p>";

    booksTable.style.display = "none"; // Скрываем, если ничего  не  найдено
  } else {
    resultContainer.innerHTML = ""; //  Очищаем  сообщение,  если  книги  найдены
    booksTable.style.display = "table";
    //!!!  Здесь добавляем строки в таблицу  !!!
    filteredBooks.forEach((book) => {
      const row = booksTableBody.insertRow(); // Создаем строку

      // Создаем  ячейки  и добавляем  их  в  строку
      const titleCell = row.insertCell();
      titleCell.textContent = book.Название;

      const authorCell = row.insertCell();
      authorCell.textContent = book.Автор;

      const countCell = row.insertCell();
      countCell.textContent = book.Количество;
      countCell.style.color = "rgb(144, 238, 144)";
      // Кнопка "Взять книгу"
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
      actionCell.appendChild(takeButton); // Добавляем  кнопку в ячейку
    });

    booksTable.style.display = "table"; // Отображаем таблицу  после заполнения
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
function confirmTakeBook() {
  if (bookToTake) {
    let studentId = localStorage.getItem("currentStudentId"); // Получаем ID студента
    console.log("studentId в confirmTakeBook:", studentId, typeof studentId);
    studentId = parseInt(studentId, 10);

    if (!studentId) {
      showToast("Ошибка: текущий студент не определен.");
      closeTakeModal();
      return; // Завершаем выполнение, если студент не найден
    }

    const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
    const bookInLibrary = books.find((b) => b.Название === bookToTake.Название);

    if (!bookInLibrary) {
      showToast("Эта книга в данный момент отсутствует.");
      closeTakeModal();
      return; // Завершаем, если книги нет в библиотеке
    }

    if (bookInLibrary.Количество === 0) {
      showToast("Книга закончилась и сейчас нет в наличии.");
      closeTakeModal();
      return; // Завершаем, если книга недоступна
    }

    let takenBooks = JSON.parse(localStorage.getItem(TAKEN_BOOKS_KEY)) || [];
    let userBooks = takenBooks.find((item) => item.userId === studentId);

    if (!userBooks) {
      userBooks = { userId: studentId, books: [] };
      takenBooks.push(userBooks);
    }

    if (userBooks.books.some((b) => b.name === bookToTake.Название)) {
      showToast("Вы уже взяли эту книгу!");
      closeTakeModal();
      return; // Завершаем, если пользователь уже взял эту книгу
    }

    // Рассчитываем срок сдачи
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Добавляем книгу в список взятых книг пользователя
    userBooks.books.push({
      name: bookToTake.Название,
      author: bookToTake.Автор,
      dueDate: dueDate.toISOString().split("T")[0],
    });

    // Обновляем данные в LocalStorage
    saveTakenBooksToLocalStorage(takenBooks);

    // Уменьшаем количество доступных экземпляров книги
    bookInLibrary.Количество--;
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));

    // Обновляем таблицы и пользовательский интерфейс
    displayUserBooks(userBooks.books);
    updateBooksTable(JSON.parse(localStorage.getItem(BOOKS_KEY)));

    // Уведомление об успешной операции
    showToast(`Книга "${bookToTake.Название}" успешно взята.`);

    // Закрываем модальное окно
    closeTakeModal();
    bookToTake = null;
    updateBooksTable();
  } else {
    showToast("Ошибка: книга не выбрана.");
    closeTakeModal();
  }
}

function calculateDueDate(borrowDays = 14) {
  // Получаем текущую дату
  const currentDate = new Date();

  // Добавляем количество дней для возврата
  currentDate.setDate(currentDate.getDate() + borrowDays);

  // Форматируем дату в удобный вид (например, YYYY-MM-DD)
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Месяцы с 0, поэтому +1
  const day = String(currentDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`; // Возвращаем дату в формате 'ГГГГ-ММ-ДД'
}

// Привязываем событие к кнопке подтверждения
document
  .getElementById("confirmTakeBtn")
  .addEventListener("click", confirmTakeBook);

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
    return showToast("Эта книга в данный момент отсутствует.");
  }
  if (bookToTake.Количество === 0) {
    return showToast("Книга закончилась и сейчас нет в наличии.");
  }
  let takenBooks = JSON.parse(localStorage.getItem(TAKEN_BOOKS_KEY)) || [];
  let userBooks = takenBooks.find((item) => item.userId === studentId);
  console.log("takenBooks  в loadUserBooks:", takenBooks); //  Проверьте  структуру takenBooks
  if (!userBooks) {
    userBooks = { userId: studentId, books: [] };
    takenBooks.push(userBooks);
  }
  if (userBooks.books.some((b) => b.name === book["Название"])) {
    return showToast("Вы уже взяли эту книгу!");
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

  showToast(`Книга "${book["Название"]}" успешно выдана.`);

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

function updateBooksTable() {
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  const booksTableBody = document.getElementById("booksTableBody");
  const takenBooks = JSON.parse(localStorage.getItem(TAKEN_BOOKS_KEY)) || [];
  const currentUserId = parseInt(localStorage.getItem("currentStudentId"), 10);

  booksTableBody.innerHTML = ""; // Очищаем таблицу

  books.forEach((book) => {
    if (book["Количество"] === 0) return;
    const row = document.createElement("tr");

    const nameCell = row.insertCell();
    nameCell.textContent = book["Название"];

    const authorCell = row.insertCell();
    authorCell.textContent = book["Автор"];

    const quantityCell = row.insertCell();
    quantityCell.textContent = book["Количество"];
    quantityCell.style.color = "rgb(144, 238, 144)";

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

    // Проверяем, взял ли пользователь эту книгу
    const userTakenBooks = takenBooks.find(
      (entry) => entry.userId === currentUserId
    );
    const isBookTaken =
      userTakenBooks &&
      userTakenBooks.books.some(
        (takenBook) => takenBook.name === book["Название"]
      );

    if (isBookTaken) {
      takeButton.disabled = true; // Делаем кнопку неактивной
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

function decreaseBookQuantity(book, studentId) {
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  const bookToUpdate = books.find((b) => b.Название === book.Название);
  console.log("decreaseBookQuantity called with studentId:", studentId);

  if (bookToUpdate && bookToUpdate.Количество > 0) {
    bookToUpdate.Количество--;
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));

    // Вызываем функцию для обновления таблицы книг у библиотекаря/админа
    const librarianWindow = window.opener;

    if (librarianWindow) {
      librarianWindow.postMessage(
        {
          type: "updateBookQuantity",
          bookTitle: book.Название,
          updatedBooks: books,
        },
        "*"
      );
    }
  }
}

function increaseBookQuantity(book) {
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];

  const bookToUpdate = books.find((b) => b.Название === book.name);

  if (bookToUpdate) {
    bookToUpdate.Количество++;

    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));

    // Вызываем функцию  для  обновления  таблицы  книг  у библиотекаря/админа

    const librarianWindow = window.opener;

    if (librarianWindow) {
      librarianWindow.postMessage(
        { type: "updateBookQuantity", bookTitle: book.name },
        "*"
      );
    }
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
function saveTakenBooksToLocalStorage(takenBooks) {
  localStorage.setItem(TAKEN_BOOKS_KEY, JSON.stringify(takenBooks));
}

function logout() {
  const account = getLoggedInAccount();
  // Если есть аккаунт и это библиотекарь или админ, перенаправляем на страницу library
  if (account && (account.role === "admin" || account.role === "librarian")) {
    if (account.role === "admin") {
      window.location.href = "../admin/admin0.html";
    } else if (account.role === "librarian") {
      window.location.href = "../librarian/librarian.html";
    }

    console.log("Logged out and returned to librarian/admin page.");
  } else {
    //  Иначе -  это обычный  студент

    localStorage.removeItem("loggedInEmail"); // Удаляем информацию  о  залогиненном пользователе

    localStorage.removeItem("currentStudentId");

    window.location.href = "../index.html"; //  Перенаправляем  на  страницу  авторизации

    console.log("Logged  out as student  and redirected to index.html");
  }
}

function getURLParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    fio: params.get("fio") ? decodeURIComponent(params.get("fio")) : null,
    group: params.get("group") ? decodeURIComponent(params.get("group")) : null,
    id: params.get("id") ? decodeURIComponent(params.get("id")) : null, // Добавлено приведение к числу при необходимости
  };
}

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

/*
function searchBook(event) {
  event.preventDefault();
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
      book.Название.toLowerCase().includes(searchInput) ||
      book.Автор.toLowerCase().includes(searchInput) ||
      String(book.Количество).includes(searchInput)
  );

  if (filteredBooks.length === 0) {
    resultContainer.innerHTML = "<p>Книги не найдены</p>";

    booksTable.style.display = "none"; // Скрываем, если ничего  не  найдено
  } else {
    resultContainer.innerHTML = ""; //  Очищаем  сообщение,  если  книги  найдены

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

      const actionsCell = row.insertCell();
      const takeButton = document.createElement("button"); //!!! Создаем  кнопку здесь!!!
      takeButton.textContent = "Взять";

      takeButton.addEventListener("click", () => {
        openTakeModal(book);
      });
      actionsCell.appendChild(takeButton); // Добавляем  кнопку в ячейку

      //Другие  действия
    });

    booksTable.style.display = "table"; // Отображаем таблицу  после заполнения
  }
}
function searchBook(event) {
  event.preventDefault(); // Отменяем перезагрузку страницы
  document.getElementById("booksTable").style.display = "none";
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

      takeButton.addEventListener("click", () => {
        openTakeModal(book);
      });
      actionsCell.appendChild(takeButton); // Добавляем  кнопку в ячейку

      //Другие  действия
    });

    booksTable.style.display = "table"; // Отображаем таблицу  после заполнения
  }
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
        returnBook(book);
        updateLibrarianBookDisplay(book.name); //  Вызываем  функцию  для  обновления  таблицы  книг
        displayUserBooks(
          loadUserBooks(parseInt(localStorage.getItem("currentStudentId"), 10))
        ); // закомментируйте, если хотите перезапускать updateBookTable
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
let bookToTake = null; // Переменная для хранения информации о книге
let isTakeModalOpen = false; // Новая переменная

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
function searchBook(event) {
  event.preventDefault();
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
      book.Название.toLowerCase().includes(searchInput) ||
      book.Автор.toLowerCase().includes(searchInput) ||
      String(book.Количество).includes(searchInput)
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

      //Другие  действия
    });

    booksTable.style.display = "table"; // Отображаем таблицу  после заполнения
  }
}
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
function searchBook(event) {
  event.preventDefault();
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
      countCell.style.color = "rgb(102, 191, 102)";
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

      //Другие  действия
    });

    booksTable.style.display = "table"; // Отображаем таблицу  после заполнения
  }
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
}function displayBooks(books) {
  const oldTable = document.getElementById("bookTable");
  if (oldTable) {
    oldTable.remove();
  }

  const adminPanel = document.getElementById("adminPanel");
  const table = document.createElement("table");
  table.id = "bookTable";
  adminPanel.appendChild(table);

  const headerRow = table.insertRow();
  const headers = ["Название", "Автор", "Количество", "Электронная версия", "Местоположение"];
  headers.forEach((headerText) => {
    const header = headerRow.insertCell();
    header.textContent = headerText;
  });

  if (!books || books.length === 0) {
    updateControlsMargin(false);

    // Отображаем сообщение, если книг нет
    displayMessage("Книга не найдена"); // Вызываем функцию для отображения сообщения
    return;
  }


  books.forEach((book) => {
      if (!Array.isArray(book)) {
        console.error("Invalid book data:", book);
        return; // Пропускаем некорректные данные
      }
    const row = table.insertRow();


    const titleCell = row.insertCell();
    titleCell.textContent = book[0] || ""; // Название

    const authorCell = row.insertCell();
    authorCell.textContent = book[1] || ""; // Автор

    const quantityCell = row.insertCell();
    const quantity = book[2];
    quantityCell.textContent = quantity !== null && quantity !== undefined ? quantity : ""; // Количество, обработка null и undefined
    updateCellColor(quantityCell, quantity); 


    const linkCell = row.insertCell();
    const linkValue = book[3];

    if (linkValue) {
      const linkElement = document.createElement("a");
      linkElement.href = linkValue;
      linkElement.target = "_blank"; 

      const tooltipText = document.createElement("span");
      tooltipText.classList.add("tooltiptext");
      tooltipText.textContent = "Открыть ссылку в новой вкладке"; 

      const bookIcon = document.createElement("ion-icon");
      bookIcon.name = "book"; 
      bookIcon.style.fontSize = "24px";
      bookIcon.style.color = "#8000ff";
      linkElement.appendChild(bookIcon);

      const tooltipContainer = document.createElement("div");
      tooltipContainer.classList.add("tooltip-container");
      tooltipContainer.appendChild(linkElement);
      tooltipContainer.appendChild(tooltipText);
      linkCell.appendChild(tooltipContainer);
    } else {
      linkCell.textContent = "Отсутствует";
      linkCell.style.color = "gray";
    }

    const locationCell = row.insertCell();
    locationCell.textContent = book[4] || "Неизвестно"; // Местоположение, обработка null/undefined
});
    

  const controls = document.getElementById("controls");
  adminPanel.insertBefore(table, controls);
  updateControlsMargin(true);
}
*/
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
      (b) => b[1] === bookToTake[1]  // bookToTake[0] - это название книги
    );
    console.log(bookInLibrary);

    if (!bookInLibrary || bookInLibrary[3] === 0) {  // bookInLibrary[2] - это ID книги, если количество равно 0
      showToast("Эта книга в данный момент отсутствует.");
      closeTakeModal();
      return;
    }

    // Проверяем, взял ли студент уже эту книгу
    const bookAlreadyTaken = await checkIfBookTaken(studentId, bookToTake[1], token);
    if (bookAlreadyTaken) {
      showToast("Вы уже взяли эту книгу!");
      closeTakeModal();
      return;
    }

    // Рассчитываем дату возврата книги
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const formattedDueDate = dueDate.toISOString().split('T')[0]; // ISO формат даты

    // Добавляем книгу в список взятых книг студента
    userBooksData.books.push({
      id: bookInLibrary[0],  // ID книги
      name: bookToTake[1],  // Название книги
      author: bookToTake[2],  // Автор книги
      dueDate: formattedDueDate,  // Дата возврата
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
    bookInLibrary[3]--;  // Уменьшаем количество книги
    console.log("Обновление количества книг:", bookInLibrary);

    try {
      // Логируем данные перед отправкой запроса
      console.log("Отправка запроса на обновление книги. Данные:", bookInLibrary);
      
      // Отправляем PUT-запрос для обновления данных о книге
      const bookResponse = await axios.post(
        `/api/books/${bookInLibrary[0]}`,  // ID книги, который мы передаем
        bookInLibrary,  // Данные о книге
        {
          headers: { Authorization: `Bearer ${token}` },  // Добавляем токен авторизации
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
        console.error("Запрос был отправлен, но не получен ответ:", error.request);
      } else {
        // Ошибка при настройке запроса
        console.error("Ошибка настройки запроса:", error.message);
      }
    }
    
    // Обновляем UI
   // displayUserBooks(userBooksData.books);
    updateBooksTable(books);

    showToast(`Книга "${bookToTake[1]}" успешно взята.`);
    closeTakeModal();
    bookToTake = null;
  } catch (error) {
    console.error("Ошибка при подтверждении взятия книги:", error.response?.data || error.message);
    showToast("Произошла ошибка при взятии книги.");
    closeTakeModal();
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
    const takenBooksResponse = await axios.get(`/api/taken_books/student/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Ответ от сервера:", takenBooksResponse.data);

    const takenBooks = takenBooksResponse.data.map((book) => book.name); // Имена взятых книг
console.log("Взятые книги:", takenBooks);
    // Сортируем книги по ID
    books.sort((a, b) => a[0] - b[0]);

    const booksTableBody = document.getElementById("booksTableBody");
    booksTableBody.innerHTML = ""; // Очистка таблицы

    books.forEach((book) => {
      if (book[3] === 0) return; // Пропускаем книги с нулевым количеством

      const row = document.createElement("tr");

      const nameCell = row.insertCell();
      nameCell.textContent = book[1]; // Название книги

      const authorCell = row.insertCell();
      authorCell.textContent = book[2]; // Автор

      const quantityCell = row.insertCell();
      quantityCell.textContent = book[3]; // Количество
      quantityCell.style.color = book[3] > 5 ? "rgb(102, 191, 102)" : "rgb(255, 94, 94)"; // Цвет в зависимости от количества

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
        takeButton.addEventListener("click", () => openTakeModal(book, studentId)); // Передаем studentId в модальное окно
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
      alert("Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.");
    }
  }
}

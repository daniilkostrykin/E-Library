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

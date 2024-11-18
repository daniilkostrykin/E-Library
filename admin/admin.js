//admin.js
const BOOKS_KEY = "books";
let addBookFormVisible = false; // Флаг для отслеживания видимости формы

document.addEventListener("DOMContentLoaded", () => {
  originalBooks = JSON.parse(localStorage.getItem(BOOKS_KEY)) || []; //
  document.getElementById("save-changes").disabled = true;
  document.getElementById("cancel").disabled = true;
  displayBooks(originalBooks);

  document.getElementById("searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    searchBook();
  });

  document.getElementById("addBookBtn").addEventListener("click", addBook);
  document
    .getElementById("save-changes")
    .addEventListener("click", saveEditBook);
  document.getElementById("cancel").addEventListener("click", cancelEditBook);
  document.getElementById("back-button").addEventListener("click", back);
  const addBookForm = document.getElementById("addBookForm"); // Предполагаемый id вашей формы

  addBookForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent form from submitting normally

    const title = document.getElementById("title").value;
    const author = document.getElementById("author").value;
    const quantity = parseInt(document.getElementById("quantity").value, 10);
    const onlineVersion = document.getElementById("onlineVersion").value;
    const location = document.getElementById("location").value;
    const success = processAddBook(title, author, quantity, onlineVersion, location);
    if (success) {
      closeModal();
    }
  });
});
function processAddBook(title, author, quantity, onlineVersion, location) {
  // Проверка обязательных полей
  if (!title) {
    showToast("Введите название книги.");
    return false;
  }
  if (!author) {
    showToast("Введите автора книги.");
    return false;
  }
  if (!quantity) {
    showToast("Введите количество книг.");
    return false;
  }

  // Проверка количества на корректность
  const quantityNum = parseInt(quantity, 10);
  if (isNaN(quantityNum) || quantityNum < 0) {
    showToast("Количество должно быть неотрицательным числом.");
    return false;
  }

  // Проверка URL для электронной версии
  if (onlineVersion && !isValidURL(onlineVersion)) {
    showToast("Электронная версия должна иметь корректный URL.");
    return false;
  }

  // Создание объекта книги
  const newBook = {
    Название: title,
    Автор: author,
    Количество: quantityNum,
    "Электронная версия": onlineVersion,
    Местоположение: location,
  };

  // Добавление книги в localStorage
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  books.push(newBook);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));

  // Обновление отображения
  originalBooks = JSON.parse(localStorage.getItem(BOOKS_KEY));
  displayBooks(originalBooks);

  return true;
}

function showError(inputField, message) {
  const errorSpan = document.getElementById(inputField.id + "Error");
  errorSpan.textContent = message;
  errorSpan.style.display = "block"; // Показываем сообщение об ошибке
  inputField.classList.add("error-input"); // Добавляем класс для стилизации поля с ошибкой (необязательно)
}

function clearError(inputField) {
  const errorSpan = document.getElementById(inputField.id + "Error");
  errorSpan.textContent = "";
  errorSpan.style.display = "none"; // Скрываем сообщение об ошибке
  inputField.classList.remove("error-input"); // Удаляем класс (необязательно)
}
// Функция для проверки URL
function isValidURL(url) {
  try {
    new URL(url); // Пробуем создать объект URL
    return true; // Если объект успешно создается — это валидная ссылка
  } catch (_) {
    return false; // Если ошибка при создании объекта — не валидный URL
  }
}
function back() {
  window.location.href = "admin0.html";
}

function displayBooks(books) {
  const table = document.getElementById("bookTable");
  table.innerHTML = "";

  // Заголовок таблицы
  const headerRow = table.insertRow();
  const headers = [
    "Название",
    "Автор",
    "Количество",
    "Электронная версия",
    "Местоположение",
    "Удаление",
  ];
  headers.forEach((headerText, index) => {
    const header = headerRow.insertCell();
    header.textContent = headerText;
    if (headerText === "Количество") {
      header.style.color = "black"; // Заголовок черного цвета
    }
  });

  // Данные книг
  books.forEach((book) => {
    const row = table.insertRow();
    Object.entries(book).forEach(([key, value]) => {
      const cell = row.insertCell();

      if (key === "Электронная версия") {
        const input = document.createElement("input");
        input.type = "text";
        input.value = value || "";
        input.placeholder = "Введите URL";
        input.style.textAlign = "center"; // Это центрирует текст внутри поля ввода

        input.addEventListener("input", () => {
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });

        cell.appendChild(input);
      } else if (key === "Количество") {
        cell.textContent = value;
        cell.contentEditable = true;

        // Установить цвет текста в зависимости от значения
        updateCellColor(cell, value);

        cell.addEventListener("input", () => {
          let newValue = cell.textContent.trim();

          // Убираем лидирующие нули
          if (/^0\d+/.test(newValue)) {
            newValue = parseInt(newValue, 10).toString();
            cell.textContent = newValue;
          }

          // Запрет на отрицательные значения и некорректный ввод
          if (isNaN(newValue) || parseInt(newValue, 10) < 0) {
            cell.textContent = 0; // Устанавливаем 0 по умолчанию
          }
          updateCellColor(cell, cell.textContent);
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });
      } else if (key === "Местоположение") {
        if (value) {
          // Если значение не пустое
          cell.textContent = value;
        } else {
          cell.textContent = "Неизвестно"; // Или любой другой текст-заполнитель
          cell.style.color = "gray"; // Серый цвет текста
        }
        cell.contentEditable = true; // Остается редактируемым
        cell.addEventListener("input", () => {
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });
      } else {
        cell.textContent = value;
        cell.contentEditable = true;
        cell.addEventListener("input", () => {
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });
      }
    });

    // Кнопка удаления
    const actionCell = row.insertCell();
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("action-button");
    deleteButton.textContent = "Удалить";
    deleteButton.style.backgroundColor = "rgb(255, 101, 101)";
    deleteButton.style.color = "white";
    deleteButton.style.border = "none";
    deleteButton.style.padding = "8px 40px";
    deleteButton.style.borderRadius = "10px";
    deleteButton.style.fontFamily = "Montserrat !important";

    deleteButton.addEventListener("click", () => {
      if (confirm("Вы уверены, что хотите удалить эту запись?")) {
        const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
        const name = row.cells[0].textContent;

        const filteredBooks = books.filter((book) => book.Название !== name);
        localStorage.setItem(BOOKS_KEY, JSON.stringify(filteredBooks));

        row.remove();
      }
    });

    actionCell.appendChild(deleteButton);
  });
}

// Вспомогательная функция для обновления цвета текста в ячейке "Количество"
function updateCellColor(cell, value) {
  const numValue = parseInt(value, 10);
  if (numValue > 0) {
    cell.style.color = "rgb(134, 243, 132)";
  } else if (numValue === 0) {
    cell.style.color = "red";
  }
}

function saveEditBook() {
  const table = document.getElementById("bookTable");
  const rows = table.rows;
  const newBooks = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.cells;

    const newBook = {
      Название: cells[0].textContent,
      Автор: cells[1].textContent,
      Количество: parseInt(cells[2].textContent),
      "Электронная версия": cells[3].firstChild.value, // Читаем значение из input
      Местоположение: cells[4].textContent,
    };
    newBooks.push(newBook);
  }

  localStorage.setItem(BOOKS_KEY, JSON.stringify(newBooks));
  originalBooks = JSON.parse(JSON.stringify(newBooks));
  originalBooks = [...newBooks]; // Обновляем originalBooks
  displayBooks(newBooks);
  document.getElementById("save-changes").disabled = true;
  document.getElementById("cancel").disabled = true;
}

function cancelEditBook() {
  displayBooks(originalBooks);
  document.getElementById("save-changes").disabled = true;
  document.getElementById("cancel").disabled = true;
}
/*
function addBook() {
  let title, author, quantity, onlineVersion, location;

  // Ввод названия книги
  while (true) {
    title = prompt("Введите название книги:").trim();
    if (title) break; // Если название введено, выходим из цикла
    showToast("Название книги обязательно!");
  }

  // Ввод автора книги
  while (true) {
    author = prompt("Введите автора книги:").trim();
    if (author) break; // Если автор введен, выходим из цикла
    showToast("Автор книги обязателен!");
  }

  // Ввод количества книг
  while (true) {
    const input = prompt("Введите количество книг:");
    quantity = parseInt(input);
    if (!isNaN(quantity) && quantity >= 0) break; // Если введено число >= 0, выходим из цикла
    showToast("Количество должно быть положительным числом или 0!");
  }
  // Ввод ссылки на электронную версию (необязательно)
  onlineVersion = prompt(
    "Введите ссылку на электронную версию (необязательно):"
  ).trim();
  if (onlineVersion === null) {
    // Если нажата "Отмена" -> null
    onlineVersion = ""; // сохраняем пустую строку
  }
  // Ввод местоположения книги (необязательно)
  location = prompt("Введите местоположение книги (необязательно):").trim();
  if (location === null) {
    // Если нажата "Отмена" -> null
    location = ""; // сохраняем пустую строку
  }
  // Создаем объект новой книги
  const newBook = {
    Название: title,
    Автор: author,
    Количество: quantity,
    "Электронная версия": onlineVersion, // Записываем значение, даже если оно пустая строка
    Местоположение: location, // Записываем значение, даже если оно пустая строка
  };
  if (onlineVersion) {
    newBook["Электронная версия"] = onlineVersion;
  }
  if (location) {
    newBook.Местоположение = location;
  }
  // Получаем книги из localStorage, добавляем новую и сохраняем обратно
  let books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  const existingBook = books.find((book) => book.Название === newBook.Название);
  if (existingBook) {
    showToast(`Книга с названием "${newBook.Название}" уже существует.`);

    let newQuantity;

    while (true) {
      const quantityInput = prompt(
        `Введите новое количество для  книги  "${newBook.Название}" (текущее  количество:  ${existingBook.Количество}):`
      );

      if (quantityInput === null) {
        return; // Выходим из  функции addBook, если нажата отмена
      }

      newQuantity = parseInt(quantityInput);

      if (!isNaN(newQuantity) && newQuantity >= 0) {
        existingBook.Количество = newQuantity;
        break;
      }

      showToast("Некорректное значение количества.");
    }
  } else {
    books.push(newBook); // If no existing book is found, only then add a new one
  }
  saveBooksToLocalStorage(books); // <-- сохраняем книги в localStorage
  originalBooks = JSON.parse(JSON.stringify(books));
  displayBooks(originalBooks); // <-- Перерисовать таблицу с новыми данными
  console.log("Добавленная книга:", newBook);
  console.log("Обновленный  массив  книг:", books);
}*/
// Функция для сохранения массива книг в localStorage
function saveBooksToLocalStorage(books) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books)); // Сохраняем обновленный массив
}

function searchBook() {
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  const query = document.getElementById("searchInput").value.toLowerCase();

  if (query.length === 0) {
    displayBooks(books);
  } else {
    const filteredBooks = books.filter(
      (book) =>
        book.Название.toLowerCase().includes(query) ||
        book.Автор.toLowerCase().includes(query)
    );

    if (filteredBooks.length) {
      displayBooks(filteredBooks);
    } else {
      showToast("Совпадений не найдено!");
    }
  }
}
function openModal() {
  document.getElementById("addBookModal").style.display = "block";
}

function closeModal() {
  document.getElementById("addBookModal").style.display = "none";
  document.getElementById("addBookForm").reset(); // Clear form inputs
}

function addBook() {
  openModal();
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

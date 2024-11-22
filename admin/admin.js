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
    const success = processAddBook(
      title,
      author,
      quantity,
      onlineVersion,
      location
    );
    if (success) {
      closeModal();
    }
  });
  // Логика перехода между полями с помощью Enter
  const formFields = addBookForm.querySelectorAll("input, textarea, select");
  formFields.forEach((field, index) => {
    field.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Отключаем стандартное поведение Enter

        // Если это последнее поле, отправляем форму
        if (index === formFields.length - 1) {
          addBookForm.requestSubmit();
        } else {
          // Перемещаем фокус на следующее поле
          formFields[index + 1].focus();
        }
      }
    });
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
  headers.forEach((headerText) => {
    const header = headerRow.insertCell();
    header.textContent = headerText;
    if (headerText === "Количество") {
      header.style.color = "black"; // Заголовок черного цвета
    }
  });

  // Данные книг
  books.forEach((book, rowIndex) => {
    const row = table.insertRow();

    Object.entries(book).forEach(([key, value], colIndex) => {
      const cell = row.insertCell();

      // Ограничиваем высоту ячейки
      cell.style.maxHeight = "50px";
      cell.style.overflow = "hidden"; // Скрываем лишний контент
      cell.style.whiteSpace = "nowrap"; // Предотвращаем перенос строк
      // Делаем ячейку фокусируемой
      cell.setAttribute("tabindex", "-1");

      if (key === "Электронная версия" || key === "Местоположение") {
        const input = document.createElement("input");
        input.type = "text";
        input.value = value || "";
        input.placeholder =
          key === "Электронная версия"
            ? "Введите URL"
            : "Введите местоположение";
        input.style.textAlign = "center";

        input.addEventListener("input", () => {
          book[key] = input.value; // Сохраняем изменения в объекте книги
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });

        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            input.blur(); // Убираем фокус
            saveEditBook(); // Сохраняем изменения
          }
        });

        cell.appendChild(input);

        input.addEventListener("keydown", (event) =>
          handleArrowNavigation(
            event,
            rowIndex + 1, // +1, чтобы учесть заголовок
            colIndex,
            table
          )
        );
      } else if (key === "Количество") {
        cell.textContent = value;
        cell.contentEditable = true;

        updateCellColor(cell, value);

        cell.addEventListener("input", () => {
          let newValue = cell.textContent.trim();

          // Убираем лидирующие нули
          if (/^0\d+/.test(newValue)) {
            newValue = parseInt(newValue, 10).toString();
            cell.textContent = newValue;
          }

          // Запрет на некорректный ввод
          if (isNaN(newValue) || parseInt(newValue, 10) < 0) {
            cell.textContent = 0;
          }

          book[key] = parseInt(cell.textContent, 10) || 0; // Сохраняем изменения в объекте книги
          updateCellColor(cell, cell.textContent);
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });

        cell.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            cell.blur(); // Убираем фокус
            saveEditBook(); // Сохраняем изменения
            showToast("Изменения сохранены.");
          }
        });

        cell.addEventListener("keydown", (event) =>
          handleArrowNavigation(
            event,
            rowIndex + 1, // +1, чтобы учесть заголовок
            colIndex,
            table
          )
        );
      } else {
        cell.textContent = value;
        cell.contentEditable = true;

        cell.addEventListener("input", () => {
          book[key] = cell.textContent; // Сохраняем изменения в объекте книги
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });

        cell.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            cell.blur(); // Убираем фокус
            saveEditBook(); // Сохраняем изменения
          }
        });

        cell.addEventListener("keydown", (event) =>
          handleArrowNavigation(
            event,
            rowIndex + 1, // +1, чтобы учесть заголовок
            colIndex,
            table
          )
        );
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
      openDeleteModal(book.Название, row);
    });

    actionCell.appendChild(deleteButton);
  });
}

// Обработка навигации по ячейкам таблицы с помощью стрелок
function handleArrowNavigation(event, rowIndex, colIndex, table) {
  const key = event.key;
  const cell = event.target.closest("td");
  const isContentEditable = cell && cell.isContentEditable;

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
    // Если пользователь в режиме редактирования, проверяем, нужно ли передвигать фокус
    if (isContentEditable && (key === "ArrowLeft" || key === "ArrowRight")) {
      const selection = window.getSelection();
      const cursorPosition = selection.anchorOffset;
      const textLength = selection.focusNode?.textContent?.length || 0;

      if (
        (key === "ArrowLeft" && cursorPosition > 0) ||
        (key === "ArrowRight" && cursorPosition < textLength)
      ) {
        // Позволяем стандартное поведение, если курсор не в крайнем положении
        return;
      }
    }

    // Отключаем стандартное поведение стрелок
    event.preventDefault();

    let targetRow = rowIndex;
    let targetCol = colIndex;

    switch (key) {
      case "ArrowUp":
        targetRow = Math.max(1, rowIndex - 1); // Не выходим за заголовок
        break;
      case "ArrowDown":
        targetRow = Math.min(table.rows.length - 1, rowIndex + 1);
        break;
      case "ArrowLeft":
        targetCol = Math.max(0, colIndex - 1);
        break;
      case "ArrowRight":
        targetCol = Math.min(
          table.rows[rowIndex].cells.length - 1,
          colIndex + 1
        );
        break;
    }

    // Переместить фокус на целевую ячейку
    const targetCell = table.rows[targetRow]?.cells[targetCol];
    if (targetCell) {
      const input = targetCell.querySelector("input, textarea");
      if (input) {
        input.focus();
        // Для input, установить курсор в конец значения
        input.selectionStart = input.selectionEnd = input.value.length;
      } else {
        targetCell.focus();
        // Для contenteditable ячеек, установить курсор в конец текста
        const range = document.createRange();
        const selection = window.getSelection();

        if (targetCell.childNodes.length > 0) {
          // ensure there is a childnode to move selection into in cell or add condition in for empty ones handling

          range.setStart(
            targetCell.childNodes[0],
            targetCell.childNodes[0].length
          );
          range.collapse(true); // Схлопываем выделение, чтобы курсор был в конце

          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }
}

let bookToDelete = null; // Переменная для хранения удаляемой книги

function openDeleteModal(bookName, row) {
  bookToDelete = { bookName, row }; // Сохраняем информацию о книге и строке
  const message = `Вы уверены, что хотите удалить книгу "${bookName}"?`;
  document.getElementById("deleteBookMessage").textContent = message;
  document.getElementById("deleteBookModal").style.display = "block";
}

function closeDeleteModal() {
  document.getElementById("deleteBookModal").style.display = "none";
  bookToDelete = null; // Очищаем переменную
}

function confirmDeleteBook() {
  if (bookToDelete) {
    const { bookName, row } = bookToDelete;

    const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
    const filteredBooks = books.filter((book) => book.Название !== bookName);

    localStorage.setItem(BOOKS_KEY, JSON.stringify(filteredBooks));
    row.remove(); // Удаляем строку из таблицы
    closeDeleteModal();
    showToast(`Книга "${bookName}" успешно удалена.`);
  }
}

// Привязываем событие к кнопке подтверждения
document
  .getElementById("confirmDeleteBtn")
  .addEventListener("click", confirmDeleteBook);

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
  let hasErrors = false;

  for (let i = 1; i < rows.length; i++) {
    // Пропускаем заголовок
    const row = rows[i];
    const cells = row.cells;

    const onlineVersion = cells[3]?.firstChild?.value || "";
    const location = cells[4]?.firstChild?.value || "";      // Из input

    // Валидация URL
    if (onlineVersion && !isValidURL(onlineVersion)) {
      showToast("Электронная версия должна иметь корректный URL.");
      cells[3].firstChild.focus();
      cells[3].firstChild.classList.add("invalid-url"); // Добавляем визуальный индикатор ошибки
      hasErrors = true;
      continue; // Пропускаем сохранение этой строки
    } else {
      cells[3]?.firstChild?.classList.remove("invalid-url"); // Убираем ошибку, если URL корректный
    }

 

    const newBook = {
      Название: cells[0]?.textContent.trim() || "",
      Автор: cells[1]?.textContent.trim() || "",
      Количество: parseInt(cells[2]?.textContent.trim(), 10) || 0,
      "Электронная версия": onlineVersion,
      Местоположение: location,
    };

    newBooks.push(newBook);
  }

  if (hasErrors) {
    showToast("Пожалуйста, исправьте ошибки перед сохранением.");
    return;
  }

  // Сохраняем данные
  localStorage.setItem(BOOKS_KEY, JSON.stringify(newBooks));
  originalBooks = [...newBooks]; // Клонируем данные в originalBooks
  displayBooks(newBooks);

  // Деактивируем кнопки после успешного сохранения
  document.getElementById("save-changes").disabled = true;
  document.getElementById("cancel").disabled = true;

  showToast("Изменения сохранены.");
}

function cancelEditBook() {
  displayBooks(originalBooks);
  document.getElementById("save-changes").disabled = true;
  document.getElementById("cancel").disabled = true;
}
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

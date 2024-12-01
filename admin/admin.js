//admin.js
axios.defaults.baseURL = "http://localhost:3000";

let addBookFormVisible = false; // Флаг для отслеживания видимости формы
let originalBooks = [];
document.addEventListener("DOMContentLoaded", async () => {
  // Загружаем книги с сервера и сохраняем их в originalBooks
  // await updateBookTable();
  const books = await fetchBooks(); // Выполняем запрос с учётом query
  displayBooks(books);
  document.getElementById("save-changes").disabled = true;
  document.getElementById("cancel").disabled = true;

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

  const addBookForm = document.getElementById("addBookForm");

  addBookForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const author = document.getElementById("author").value;
    const quantity = parseInt(document.getElementById("quantity").value, 10);
    const onlineVersion = document.getElementById("onlineVersion").value;
    const location = document.getElementById("location").value;

    const success = await processAddBook(
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
      } // Добавляем стрелки
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        handleArrowNavigationForForm(event, formFields, index);
      }
    });
  });
});
// Обновление таблицы с книгами
async function updateBookTable() {
  try {
    const response = await axios.get("/api/books"); // Предполагаемый эндпоинт
    originalBooks = response.data;
    displayBooks(originalBooks);
  } catch (error) {
    console.error("Ошибка при загрузке данных с сервера", error);
    showToast("Не удалось загрузить данные. Попробуйте позже.");
  }
}
// Навигация по ячейкам и полям формы с помощью стрелок
function handleArrowNavigationForForm(event, fields, currentIndex) {
  event.preventDefault();
  let targetIndex = currentIndex;

  switch (event.key) {
    case "ArrowUp":
      targetIndex = Math.max(0, currentIndex - 1);
      break;
    case "ArrowDown":
      targetIndex = Math.min(fields.length - 1, currentIndex + 1);
      break;
    case "ArrowLeft":
      // Для перехода влево по горизонтали, обработка для таблицы
      break;
    case "ArrowRight":
      // Для перехода вправо по горизонтали, обработка для таблицы
      break;
  }

  fields[targetIndex].focus(); // Переместить фокус
}

// Обработка навигации для ячеек таблицы
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
        return; // Оставляем стандартное поведение, если курсор не в крайнем положении
      }
    }

    // Отключаем стандартное поведение стрелок
    event.preventDefault();

    let targetRow = rowIndex;
    let targetCol = colIndex;

    switch (key) {
      case "ArrowUp":
        targetRow = Math.max(1, rowIndex - 1);
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

    const targetCell = table.rows[targetRow]?.cells[targetCol];
    if (targetCell) {
      const input = targetCell.querySelector("input, textarea");
      if (input) {
        input.focus();
        input.selectionStart = input.selectionEnd = input.value.length;
      } else {
        targetCell.focus();
      }
    }
  }
}
async function processAddBook(
  title,
  author,
  quantity,
  onlineVersion,
  location
) {
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

  const newBook = {
    Название: title,
    Автор: author,
    Количество: quantity,
    "Электронная версия": onlineVersion,
    Местоположение: location,
  };

  try {
    await axios.post("/api/books", newBook); // Эндпоинт для добавления
    await updateBookTable();
    showToast("Книга успешно добавлена!");
    return true;
  } catch (error) {
    console.error("Ошибка при добавлении книги", error);
    showToast("Не удалось добавить книгу. Попробуйте позже.");
    return false;
  }
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
  });
async function fetchBooks(query = "") {
  try {
    const token = localStorage.getItem("token"); // Получаем токен из localStorage

    const response = await axios.get("/api/books", {
      params: { query },
      headers: {
        Authorization: `Bearer ${token}`,  // Исправлено
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
async function displayBooks(books) {
  const table = document.getElementById("bookTable");
  table.innerHTML = ""; // Очищаем таблицу
  const token = localStorage.getItem("token"); // Получаем токен

  if (!token) {
    alert("Необходима авторизация.");
    window.location.href = "/login"; // Перенаправление на страницу входа
    return;
  }

  console.log("Books from server:", books); // Добавьте эту строку для отладки
  // Всегда очищаем таблицу и resultContainer перед отображением результатов
  const resultContainer = document.getElementById("result"); // Контейнер для сообщения
  resultContainer.innerHTML = "";
  if (books.length === 0) {
    // Если книги не найдены
    resultContainer.innerHTML = "<p>Книги не найдены</p>"; // Сообщение в resultContainer
    booksTable.style.display = "none"; // Скрываем таблицу
    resultContainer.style.display = "block"; // Показываем сообщение
  } else {
    resultContainer.innerHTML = ""; // Очищаем resultContainer, если книги найдены
    resultContainer.style.display = "none"; // Скрываем сообщение

  }

  // Обновляем margin в зависимости от наличия данных
  updateControlsMargin(books.length > 0);
  // Заголовок таблицы
  const headerRow = table.insertRow();
  const headers = ["ID",
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


  books.forEach((book, rowIndex) => {
    if (!Array.isArray(book)) {
      console.error("Invalid book data:", book);
      return; // Пропускаем некорректные данные
    }
    const row = table.insertRow(); // Создаем строку

    Object.entries(book).forEach(([key, value], colIndex) => {
      const cell = row.insertCell();

      // Ограничиваем высоту ячейки
      cell.style.maxHeight = "50px";
      cell.style.overflow = "hidden"; // Скрываем лишний контент
      cell.style.whiteSpace = "nowrap"; // Предотвращаем перенос строк
      // Делаем ячейку фокусируемой
      cell.setAttribute("tabindex", "-1");

      if (key === "Электронная версия" || key === "Местоположение") {
        const input = document.createElement("input"); // Всегда создаем новый input
        input.type = "text";
        input.value = value || "";
        input.placeholder =
          key === "Электронная версия"
            ? "Введите URL"
            : "Введите местоположение";
        input.style.textAlign = "center";

        input.addEventListener("input", () => {
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

        input.addEventListener("keydown", (event) =>
          handleArrowNavigation(
            event,
            rowIndex + 1, // +1, чтобы учесть заголовок
            colIndex,
            table
          )
        );

        cell.appendChild(input);
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
            showToast("Изменения сохранены."); // или другой обработчик
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

// Удаление книги
async function confirmDeleteBook() {
  if (!bookToDelete) return;

  try {
    await axios.delete(`/api/books/${bookToDelete.bookName}`); // Эндпоинт удаления
    await updateBookTable();
    closeDeleteModal();
    showToast(`Книга "${bookToDelete.bookName}" успешно удалена.`);
  } catch (error) {
    console.error("Ошибка при удалении книги", error);
    showToast("Не удалось удалить книгу. Попробуйте позже.");
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

// Сохранение изменений
async function saveEditBook() {
  const table = document.getElementById("bookTable");
  const rows = table.rows;
  const newBooks = [];
  let hasErrors = false;

  for (let i = 1; i < rows.length; i++) {
    // Пропускаем заголовок
    const row = rows[i];
    const cells = row.cells;

    const title = cells[0]?.textContent.trim();
    const author = cells[1]?.textContent.trim();
    const quantity = parseInt(cells[2]?.textContent.trim(), 10) || 0;
    const onlineVersion = cells[3]?.firstChild?.value || "";
    const location = cells[4]?.firstChild?.value || ""; // Из input

    // Проверка на пустые поля
    if (!title) {
      hasErrors = true;
      cells[0].classList.add("error-cell");
    } else {
      cells[0].classList.remove("error-cell");
    }

    if (!author) {
      hasErrors = true;
      cells[1].classList.add("error-cell");
    } else {
      cells[1].classList.remove("error-cell");
    }

    // Проверка URL
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
      Название: title,
      Автор: author,
      Количество: quantity,
      "Электронная версия": onlineVersion,
      Местоположение: location,
    };
  }

  try {
    await axios.put("/api/books", updatedBooks); // Эндпоинт для обновления
    await updateBookTable();
    showToast("Изменения успешно сохранены.");
  } catch (error) {
    console.error("Ошибка при сохранении изменений", error);
    showToast("Не удалось сохранить изменения. Попробуйте позже.");
  }
}

async function cancelEditBook() {
  try {
    // Загружаем актуальный список книг с сервера
    const response = await axios.get("/api/books"); // Эндпоинт для получения всех книг
    const books = response.data;

    originalBooks = books.map((book) => ({ ...book })); // Обновляем оригинал
    displayBooks(originalBooks);

    // Отключаем кнопки после отмены редактирования
    document.getElementById("save-changes").disabled = true;
    document.getElementById("cancel").disabled = true;
  } catch (error) {
    console.error("Ошибка при отмене редактирования", error);
    showToast("Не удалось отменить изменения. Попробуйте позже.");
  }
}

async function searchBook() {
  const query = document.getElementById("searchInput").value.toLowerCase();

  try {
    const response = await axios.get("/api/books/search", {
      params: { query },
    }); // Предполагаемый эндпоинт поиска
    const books = response.data;

    if (books.length) {
      displayBooks(books);
    } else {
      showToast("Совпадений не найдено!");
    }
  } catch (error) {
    console.error("Ошибка при поиске книг", error);
    showToast("Не удалось выполнить поиск. Попробуйте позже.");
  }
}

function openModal() {
  document.getElementById("addBookModal").style.display = "block";
  setTimeout(() => {
    document.getElementById("title").focus(); // "title" - id вашего первого поля ввода
  }, 0); // setTimeout используется для гарантии, что DOM полностью загружен.
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
function updateControlsMargin(isDataExist) {
  const controls = document.getElementById("controls");
  if (isDataExist) {
    controls.style.marginTop = "20px";
  } else {
    controls.style.marginTop = "200px";
  }
}

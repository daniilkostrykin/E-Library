//admin.js
axios.defaults.baseURL = "http://localhost:3000";

let addBookFormVisible = false; // Флаг для отслеживания видимости формы
let originalBooks = [];
document.addEventListener("DOMContentLoaded", async () => {
  // Загружаем книги с сервера и сохраняем их в originalBooks
  // await updateBookTable();
  const table = document.getElementById("bookTable");

  // Добавляем обработчик событий для всей таблицы
  table.addEventListener("keydown", (event) => {
    const cell = event.target.closest("td");
    if (!cell) return;

    const rowIndex = cell.parentNode.rowIndex;
    const colIndex = cell.cellIndex;

    handleArrowNavigation(event, rowIndex, colIndex, table);
  });

  // Загружаем все книги и отображаем их
  const books = await fetchAllBooks();
  displayBooks(books);

  // Деактивируем кнопки сохранения и отмены по умолчанию
  document.getElementById("save-changes").disabled = true;
  document.getElementById("cancel").disabled = true;

  // Обработчик отправки формы поиска
  document.getElementById("searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    searchBook();
  });

  // Обработчик для кнопки добавления книги
  document.getElementById("addBookBtn").addEventListener("click", addBook);

  // Обработчик для сохранения изменений
  document.getElementById("save-changes").addEventListener("click", saveEditBook);

  // Обработчик для отмены изменений
  document.getElementById("cancel").addEventListener("click", cancelEditBook);

  // Обработчик для кнопки возврата
  document.getElementById("back-button").addEventListener("click", back);

  const addBookForm = document.getElementById("addBookForm");

  // Обработчик отправки формы добавления книги
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

  // Логика перехода между полями с помощью Enter в форме добавления книги
  const formFields = addBookForm.querySelectorAll("input, textarea, select");
  formFields.forEach((field, index) => {
    field.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Отключаем стандартное поведение Enter

        // Если это последнее поле, отправляем форму
        if (index === formFields.length - 1) {
          addBookForm.requestSubmit(); // Явная отправка формы
        } else {
          // Перемещаем фокус на следующее поле
          formFields[index + 1].focus();
        }
      }

      // Добавляем обработку стрелок для перехода между полями
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
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get("/api/books", {
      // и передаем его в headers
      headers: { Authorization: `Bearer ${token}` },
    }); // Предполагаемый эндпоинт
    originalBooks = response.data;
    originalBooks.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10)); // Сортируем по ID

    displayBooks(originalBooks);
  } catch (error) {
    console.error("Ошибка при загрузке данных с сервера", error);
    showToast("Не удалось загрузить данные. Попробуйте позже.");
  }
}
async function fetchAllBooks() {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get("/api/books/all", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении всех книг:", error);
    showToast("Не удалось получить книги. Проверьте соединение."); // Или более подробное сообщение об ошибке
    return []; // Возвращаем пустой массив в случае ошибки
  }
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
        Authorization: `Bearer ${token}`, // Исправлено
      },
    });
    const books = await response.json();
    originalBooks = books; // Сохраняем оригинальные данные
    return books;
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
  table.innerHTML = "";

  // Заголовок таблицы
  const headerRow = table.insertRow();
  const headers = [
    "ID",
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
  books.sort((a, b) => {
    const idA = parseInt(a.id, 10) || 0; // Преобразуем в число, или 0, если не число
    const idB = parseInt(b.id, 10) || 0;
    return idA - idB;
  });
  // Данные книг
  books.forEach((book) => {
    const row = table.insertRow();
    Object.entries(book).forEach(([key, value]) => {
      const cell = row.insertCell();
      // Ограничиваем высоту ячейки
      cell.style.maxHeight = "50px";
      cell.style.overflow = "hidden"; // Скрываем лишний контент
      cell.style.whiteSpace = "nowrap"; // Предотвращаем перенос строк
      // Делаем ячейку фокусируемой

      cell.setAttribute("tabindex", "-1");

      // console.log("Key:", key);
      if (key === "4") {
        cell.textContent = value || "Не указано"; // Текст вместо поля ввода
        cell.contentEditable = true; // Сделать ячейку редактируемой

        // Добавляем обработчик на изменение содержимого ячейки
        cell.addEventListener("input", () => {
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });

        // Можно также обрабатывать событие "blur" (когда ячейка теряет фокус)
        cell.addEventListener("blur", () => {
          const newValue = cell.textContent.trim();
          if (!newValue) {
            cell.textContent = "Не указано"; // Восстановление значения, если оставлено пустым
          }
        });
      } else if (key === "3") {
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
      } else if (key === "4") {
        cell.textContent = value || "Неизвестно"; // Текст вместо поля ввода
        cell.contentEditable = true; // Сделать ячейку редактируемой

        // Добавляем обработчик на изменение содержимого ячейки
        cell.addEventListener("input", () => {
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });

        // Можно также обрабатывать событие "blur" (когда ячейка теряет фокус)
        cell.addEventListener("blur", () => {
          const newValue = cell.textContent.trim();
          if (!newValue) {
            cell.textContent = "Неизвестно"; // Восстановление значения, если оставлено пустым
          }
        });
      } else if (key === "0") {
        cell.textContent = value;
        cell.contentEditable = false;
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
      openDeleteModal(book);
    });

    actionCell.appendChild(deleteButton);
  });
}
// Сохранение изменений

// Метод для сохранения изменений в книгах
async function saveEditBook() {
  const table = document.getElementById("bookTable");
  const rows = table.rows;
  const updatedBooks = [];
  let hasErrors = false;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.cells;

    const title = cells[0].textContent.trim(); // Первая колонка — название
    const author = cells[1].textContent.trim(); // Вторая колонка — автор
    const quantity = parseInt(cells[2].textContent.trim(), 10) || 0;

    const onlineVersionInput = row.querySelector(".online-version");
    const locationInput = row.querySelector(".location");
    const online_version = onlineVersionInput
      ? onlineVersionInput.value.trim()
      : "Неизвестность";
    const location = locationInput ? locationInput.value.trim() : null;

    // Валидация
    if (!title || !author) {
      hasErrors = true;
      if (!title) cells[0].classList.add("error-cell");
      if (!author) cells[1].classList.add("error-cell");
      showToast("Заполните название и автора для всех книг.");
      return; // Останавливаемся, если есть ошибки
    } else {
      cells[0].classList.remove("error-cell");
      cells[1].classList.remove("error-cell");
    }

    updatedBooks.push({
      id: parseInt(cells[0].textContent.trim(), 10), // Преобразуем ID в число
      title: cells[1].textContent.trim() || "Без названия", // Устанавливаем значение по умолчанию
      author: cells[2].textContent.trim() || "Неизвестный автор",
      quantity: parseInt(cells[3].textContent.trim(), 10) || 0, // Устанавливаем 0, если пусто
      online_version: cells[4].textContent.trim() || "Неизвестность",
      location: cells[5].textContent.trim() || "Неизвестно", // Обрабатываем пустое поле location
    });
  }

  const token = localStorage.getItem("token");

  try {
    const response = await axios.post("/api/books/update", updatedBooks, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 200) {
      const books = await fetchAllBooks();
      displayBooks(books);

      showToast("Изменения успешно сохранены.");

      document.getElementById("save-changes").disabled = true;
      document.getElementById("cancel").disabled = true;
    } else {
      showToast(
        `Ошибка при обновлении книг: ${response.status} - ${response.data.error}`
      );
    }
  } catch (error) {
    console.error("Ошибка при сохранении изменений", error);
    if (error.response) {
      showToast(
        `Ошибка ${error.response.status}: ${
          error.response.data.error || error.response.data.message
        }`
      );
    } else if (error.request) {
      showToast("Ошибка сети! Проверьте соединение");
    } else {
      showToast("Ошибка отправки запроса");
    }
  }
}

async function cancelEditBook() {
  try {
    const token = localStorage.getItem("token");
    // Загружаем актуальный список книг с сервера
    const response = await axios.get("/api/books", {
      // и передаем его в headers
      headers: { Authorization: `Bearer ${token}` },
    }); // Эндпоинт для получения всех книг
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
// Обработка навигации для ячеек таблицы
function handleArrowNavigation(event, rowIndex, colIndex, table) {
  const key = event.key;
  const cell = event.target.closest("td");

  // Игнорируем первый столбец (если colIndex === 0)
  if (colIndex === 0) {
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault(); // Убираем действие Enter в ячейках таблицы
    saveEditBook();
    return;
  }
  const isContentEditable = cell && cell.isContentEditable;

  // Если нажата стрелка влево и мы находимся в первой позиции ячейки первого столбца
  if (
    key === "ArrowLeft" &&
    colIndex === 1 &&
    cell &&
    cell.textContent.length === 0
  ) {
    // Отключаем переход влево, если курсор в начале ячейки
    event.preventDefault();
    return;
  }

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
        targetRow = Math.max(1, rowIndex - 1); // Не выходим за границы таблицы
        break;
      case "ArrowDown":
        targetRow = Math.min(table.rows.length - 1, rowIndex + 1);
        break;
      case "ArrowLeft":
        targetCol = Math.max(1, colIndex - 1); // Не переходим в первый столбец
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
      targetCell.focus(); // Перемещаем фокус на новую ячейку
    }
  }
}
async function processAddBook(title, author, quantity, onlineVersion, location) {
  const token = localStorage.getItem("token");

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

  const newBook = {
    Название: title,
    Автор: author,
    Количество: quantity,
    Местоположение: location,
    "Электронная версия": onlineVersion || null, // Если есть онлайн-версия
  };
  

  try {
    const response = await axios.post("/api/books", newBook, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const books = await fetchAllBooks();
    displayBooks(books);
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

let bookToDelete = null; // Переменная для хранения удаляемой книги

function openDeleteModal(book) {
  bookToDelete = book; // Сохраняем информацию о книге и строке
  console.log("bookToDelete:", bookToDelete);
  const message = `Вы уверены, что хотите удалить книгу "${book[1]}"?`;
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
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Ошибка авторизации. Войдите в систему.");
      closeDeleteModal();
      return;
    }
    await axios.delete(`/api/books/${bookToDelete[0]}`, {
      headers: { Authorization: `Bearer ${token}` },
    }); // Эндпоинт удаления
    const books = await fetchAllBooks();
    displayBooks(books);    closeDeleteModal();
    console.log("bookToDelete:", bookToDelete);
    // showToast(`Книга "${bookToDelete[1]}" успешно удалена.`);
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
    cell.style.color = "green";
  } else if (numValue === 0) {
    cell.style.color = "red";
  }
}

async function searchBook() {
  // clearPreviousResults();
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  if (query !== "") {
    // Если поле поиска НЕ пустое (содержит текст)
    const books = await fetchBooks(query);
    displayBooks(books);
  } // Иначе (поле поиска пустое или содержит только пробелы) - ничего не делаем

  // Обновляем margin в зависимости от наличия данных
  const bookTable = document.getElementById("bookTable");
  updateControlsMargin(bookTable !== null);
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

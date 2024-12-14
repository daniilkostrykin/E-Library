//admin.js
axios.defaults.baseURL = "http://localhost:3000";

let addBookFormVisible = false;
let originalBooks = [];
document.addEventListener("DOMContentLoaded", async () => {
  const table = document.getElementById("bookTable");

  table.addEventListener("keydown", (event) => {
    const cell = event.target.closest("td");
    if (!cell) return;

    const rowIndex = cell.parentNode.rowIndex;
    const colIndex = cell.cellIndex;

    handleArrowNavigation(event, rowIndex, colIndex, table);
  });

  const books = await fetchAllBooks();
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

  const formFields = addBookForm.querySelectorAll("input, textarea, select");
  formFields.forEach((field, index) => {
    field.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();

        if (index === formFields.length - 1) {
          addBookForm.requestSubmit();
        } else {
          formFields[index + 1].focus();
        }
      }

      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        handleArrowNavigationForForm(event, formFields, index);
      }
    });
  });
});

async function updateBookTable() {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get("/api/books", {
      headers: { Authorization: `Bearer ${token}` },
    });
    originalBooks = response.data;
    originalBooks.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));

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
    showToast("Не удалось получить книги. Проверьте соединение.");
    return [];
  }
}
document
  .getElementById("searchForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const query = document
      .getElementById("searchInput")
      .value.trim()
      .toLowerCase();
    const books = await fetchBooks(query);
    displayBooks(books);
  });
async function fetchBooks(query = "") {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.get("/api/books", {
      params: { query },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const books = await response.data;
    originalBooks = books;
    return books;
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
  const table = document.getElementById("bookTable");
  table.innerHTML = "";

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
      header.style.color = "black";
    }
  });
  books.sort((a, b) => {
    const idA = parseInt(a.id, 10) || 0;
    const idB = parseInt(b.id, 10) || 0;
    return idA - idB;
  });

  books.forEach((book) => {
    const row = table.insertRow();
    Object.entries(book).forEach(([key, value]) => {
      const cell = row.insertCell();

      cell.style.maxHeight = "50px";
      cell.style.overflow = "hidden";
      cell.style.whiteSpace = "nowrap";

      cell.setAttribute("tabindex", "-1");

      if (key === "4") {
        cell.textContent = value || "Не указано";
        cell.contentEditable = true;

        cell.addEventListener("input", () => {
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });

        cell.addEventListener("blur", () => {
          const newValue = cell.textContent.trim();
          if (!newValue) {
            cell.textContent = "Не указано";
          }
        });
      } else if (key === "3") {
        cell.textContent = value;
        cell.contentEditable = true;

        updateCellColor(cell, value);

        cell.addEventListener("input", () => {
          let newValue = cell.textContent.trim();

          if (/^0\d+/.test(newValue)) {
            newValue = parseInt(newValue, 10).toString();
            cell.textContent = newValue;
          }

          if (isNaN(newValue) || parseInt(newValue, 10) < 0) {
            cell.textContent = 0;
          }
          updateCellColor(cell, cell.textContent);
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });
      } else if (key === "4") {
        cell.textContent = value || "Неизвестно";
        cell.contentEditable = true;

        cell.addEventListener("input", () => {
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });

        cell.addEventListener("blur", () => {
          const newValue = cell.textContent.trim();
          if (!newValue) {
            cell.textContent = "Неизвестно";
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

async function saveEditBook() {
  const table = document.getElementById("bookTable");
  const rows = table.rows;
  const updatedBooks = [];
  let hasErrors = false;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.cells;

    const title = cells[0].textContent.trim();
    const author = cells[1].textContent.trim();
    const quantity = parseInt(cells[2].textContent.trim(), 10) || 0;

    const onlineVersionInput = row.querySelector(".online-version");
    const locationInput = row.querySelector(".location");
    const online_version = onlineVersionInput
      ? onlineVersionInput.value.trim()
      : "Неизвестность";
    const location = locationInput ? locationInput.value.trim() : null;

    if (!title || !author) {
      hasErrors = true;
      if (!title) cells[0].classList.add("error-cell");
      if (!author) cells[1].classList.add("error-cell");
      showToast("Заполните название и автора для всех книг.");
      return;
    } else {
      cells[0].classList.remove("error-cell");
      cells[1].classList.remove("error-cell");
    }

    updatedBooks.push({
      id: parseInt(cells[0].textContent.trim(), 10),
      title: cells[1].textContent.trim() || "Без названия",
      author: cells[2].textContent.trim() || "Неизвестный автор",
      quantity: parseInt(cells[3].textContent.trim(), 10) || 0,
      online_version: cells[4].textContent.trim() || "Неизвестность",
      location: cells[5].textContent.trim() || "Неизвестно",
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

    const response = await axios.get("/api/books", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const books = response.data;

    originalBooks = books.map((book) => ({ ...book }));
    displayBooks(originalBooks);

    document.getElementById("save-changes").disabled = true;
    document.getElementById("cancel").disabled = true;
  } catch (error) {
    console.error("Ошибка при отмене редактирования", error);
    showToast("Не удалось отменить изменения. Попробуйте позже.");
  }
}

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
      break;
    case "ArrowRight":
      break;
  }

  fields[targetIndex].focus();
}

function handleArrowNavigation(event, rowIndex, colIndex, table) {
  const key = event.key;
  const cell = event.target.closest("td");

  if (colIndex === 0) {
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    saveEditBook();
    return;
  }
  const isContentEditable = cell && cell.isContentEditable;

  if (
    key === "ArrowLeft" &&
    colIndex === 1 &&
    cell &&
    cell.textContent.length === 0
  ) {
    event.preventDefault();
    return;
  }

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
    if (isContentEditable && (key === "ArrowLeft" || key === "ArrowRight")) {
      const selection = window.getSelection();
      const cursorPosition = selection.anchorOffset;
      const textLength = selection.focusNode?.textContent?.length || 0;

      if (
        (key === "ArrowLeft" && cursorPosition > 0) ||
        (key === "ArrowRight" && cursorPosition < textLength)
      ) {
        return;
      }
    }

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
        targetCol = Math.max(1, colIndex - 1);
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
      targetCell.focus();
    }
  }
}
async function processAddBook(
  title,
  author,
  quantity,
  onlineVersionInput,
  location
) {
  const token = localStorage.getItem("token");

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

  const quantityNum = parseInt(quantity, 10);
  if (isNaN(quantityNum) || quantityNum < 0) {
    showToast("Количество должно быть неотрицательным числом.");
    return false;
  }

  let onlineVersion = null;

  if (!onlineVersionInput) {
    try {
      const searchResponse = await axios.get(
        `http://localhost:3000/api/search_first_read_link?book_name=${encodeURIComponent(
          title
        )}`
      );

      if (searchResponse.data && searchResponse.data.read_link) {
        onlineVersion = searchResponse.data.read_link;
        showToast("Ссылка на онлайн-версию найдена!");
      } else {
        throw new Error("Ссылка на книгу не найдена.");
      }
    } catch (error) {
      console.error("Ошибка поиска электронной версии:", error);
      showToast(
        "Не удалось найти электронную версию книги. Продолжайте без неё."
      );
      onlineVersion = null;
    }
  } else {
    onlineVersion = onlineVersionInput;
  }

  const newBook = {
    Название: title,
    Автор: author,
    Количество: quantity,
    Местоположение: location,
    "Электронная версия": onlineVersion,
  };

  try {
    const response = await axios.post("/api/books", newBook, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 201) {
      const books = await fetchAllBooks();
      displayBooks(books);
      showToast("Книга успешно добавлена!");
      return true;
    } else {
      console.error("Ошибка при добавлении книги:", response.data);
      showToast("Ошибка сервера при добавлении книги. Попробуйте позже.");
      return false;
    }
  } catch (error) {
    console.error("Ошибка при добавлении книги:", error);
    showToast("Ошибка при добавлении книги.");
    return false;
  }
}

function showError(inputField, message) {
  const errorSpan = document.getElementById(inputField.id + "Error");
  errorSpan.textContent = message;
  errorSpan.style.display = "block";
  inputField.classList.add("error-input");
}

function clearError(inputField) {
  const errorSpan = document.getElementById(inputField.id + "Error");
  errorSpan.textContent = "";
  errorSpan.style.display = "none";
  inputField.classList.remove("error-input");
}

function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}
function back() {
  window.location.href = "admin0.html";
}

let bookToDelete = null;

function openDeleteModal(book) {
  bookToDelete = book;
  console.log("bookToDelete:", bookToDelete);
  const message = `Вы уверены, что хотите удалить книгу "${book[1]}"?`;
  document.getElementById("deleteBookMessage").textContent = message;
  document.getElementById("deleteBookModal").style.display = "block";
}

function closeDeleteModal() {
  document.getElementById("deleteBookModal").style.display = "none";
  bookToDelete = null;
}

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
    });
    const books = await fetchAllBooks();
    displayBooks(books);
    closeDeleteModal();
    console.log("bookToDelete:", bookToDelete);
  } catch (error) {
    console.error("Ошибка при удалении книги", error);
    showToast("Не удалось удалить книгу. Попробуйте позже.");
  }
}

document
  .getElementById("confirmDeleteBtn")
  .addEventListener("click", confirmDeleteBook);

function updateCellColor(cell, value) {
  const numValue = parseInt(value, 10);
  if (numValue > 0) {
    cell.style.color = "green";
  } else if (numValue === 0) {
    cell.style.color = "red";
  }
}

async function searchBook() {
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  if (query !== "") {
    const books = await fetchBooks(query);
    displayBooks(books);
  }

  const bookTable = document.getElementById("bookTable");
  updateControlsMargin(bookTable !== null);
}

function openModal() {
  document.getElementById("addBookModal").style.display = "block";
  setTimeout(() => {
    document.getElementById("title").focus();
  }, 0);
}

function closeModal() {
  document.getElementById("addBookModal").style.display = "none";
  document.getElementById("addBookForm").reset();
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

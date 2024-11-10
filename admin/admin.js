const BOOKS_KEY = "books";
let originalBooks = []; // Глобальная переменная для хранения оригинальных данных

function logout() {
  window.location.href = "../index.html";
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
    deleteButton.style.fontFamily = "Montserrat,Times New Roman, sans-serif !important";

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
  displayBooks(newBooks);
  document.getElementById("save-changes").disabled = true;
  document.getElementById("cancel").disabled = true;
}

function cancelEditBook() {
  displayBooks(originalBooks);
  document.getElementById("save-changes").disabled = true;
  document.getElementById("cancel").disabled = true;
}

function addBook() {
  let title, author, quantity, onlineVersion, location;

  // Ввод названия книги
  while (true) {
    title = prompt("Введите название книги:").trim();
    if (title) break; // Если название введено, выходим из цикла
    alert("Название книги обязательно!");
  }

  // Ввод автора книги
  while (true) {
    author = prompt("Введите автора книги:").trim();
    if (author) break; // Если автор введен, выходим из цикла
    alert("Автор книги обязателен!");
  }

  // Ввод количества книг
  while (true) {
    const input = prompt("Введите количество книг:");
    quantity = parseInt(input);
    if (!isNaN(quantity) && quantity >= 0) break; // Если введено число >= 0, выходим из цикла
    alert("Количество должно быть положительным числом или 0!");
  }

  // Ввод ссылки на электронную версию
  while (true) {
    onlineVersion = prompt("Введите ссылку на электронную версию:").trim();
    if (onlineVersion) break; // Если ссылка введена, выходим из цикла
    alert("Ссылка на электронную версию обязательна!");
  }

  // Ввод местоположения книги
  while (true) {
    location = prompt("Введите местоположение книги:").trim();
    if (location) break; // Если местоположение введено, выходим из цикла
    alert("Местоположение книги обязательно!");
  }

  // Создаем объект новой книги
  const newBook = {
    Название: title,
    Автор: author,
    Количество: quantity,
    "Электронная версия": onlineVersion,
    Местоположение: location,
  };

  // Сохраняем в локальное хранилище
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  books.push(newBook);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  originalBooks = JSON.parse(JSON.stringify(books));

  // Обновляем отображение книг
  displayBooks(books);
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
      alert("Совпадений не найдено!");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  originalBooks = JSON.parse(JSON.stringify(books));
  document.getElementById("save-changes").disabled = true;
  document.getElementById("cancel").disabled = true;
  displayBooks(books);

  document.getElementById("searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    searchBook();
  });

  document.getElementById("addBookBtn").addEventListener("click", addBook);
  document
    .getElementById("save-changes")
    .addEventListener("click", saveEditBook);
  document.getElementById("cancel").addEventListener("click", cancelEditBook);
  document.getElementById("exit-button").addEventListener("click", logout);
});

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
  headers.forEach((headerText) => {
    const header = headerRow.insertCell();
    header.textContent = headerText;
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
        input.style.width = "100%";

        input.addEventListener("input", () => {
          document.getElementById("save-changes").disabled = false;
          document.getElementById("cancel").disabled = false;
        });

        cell.appendChild(input);
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
  const title = prompt("Введите название книги:");
  if (title === null) return;

  const author = prompt("Введите автора книги:");
  const quantity = parseInt(prompt("Введите количество книг:"));
  const onlineVersion = prompt("Cсылка на электронную версию:");
  const location = prompt("Введите местоположение книги:");

  if (title && author && location && quantity >= 0) {
    if (onlineVersion.length > 0) {
      const newBook = {
        Название: title,
        Автор: author,
        Количество: quantity,
        "Электронная версия": onlineVersion,
        Местоположение: location,
      };

      const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
      books.push(newBook);
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));

      displayBooks(books);
    } else {
      alert("Добавьте ссылку!");
    }
  } else {
    alert("Заполните все поля!");
  }
}

function deleteBook() {
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();

  if (query.length === 0) {
    alert("Введите название книги для удаления.");
    return;
  }

  const filteredBooks = books.filter(
    (book) => book.Название.toLowerCase() === query
  );

  if (filteredBooks.length === 1) {
    const bookToDelete = filteredBooks[0];
    if (confirm("Удалить книгу " + bookToDelete.Название + "?")) {
      const index = books.indexOf(bookToDelete);
      if (index > -1) {
        books.splice(index, 1);
        localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
        displayBooks(books);
      }
    }
  } else if (filteredBooks.length > 1) {
    alert("Слишком много совпадений.");
  } else {
    alert("Совпадений не найдено!");
  }
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
  document.getElementById("delete-book").addEventListener("click", deleteBook);
  document.getElementById("exit-button").addEventListener("click", logout);
});

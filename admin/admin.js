const BOOKS_KEY = "books";

function logout() {
  window.location.href = "../index.html";
}

function displayBooks(books) {
  const table = document.getElementById("bookTable");
  table.innerHTML = ""; // Очищаем таблицу

  const headerRow = table.insertRow();
  const headers = [
    "Название",
    "Автор",
    "Количество",
    "QR",
    "Наличие бумажной версии",
    "Местоположение",
  ];
  headers.forEach((headerText) => {
    const header = headerRow.insertCell();
    header.textContent = headerText;
  });

  books.forEach((book) => {
    const row = table.insertRow();
    Object.entries(book).forEach(([key, value]) => {
      const cell = row.insertCell();

      if (key === "QR") {
        const qrElement = document.createElement("div");
        qrElement.innerHTML = value
          ? '<ion-icon name="qr-code-outline"></ion-icon>'
          : "Нет";
        cell.appendChild(qrElement);
      } else if (key === "НаличиеБумажнойВерсии") {
        cell.textContent = value ? "Да" : "Нет";
      } else if (key === "Местоположение") {
        cell.innerHTML = `<ion-icon name="location-outline"></ion-icon>`;
      } else {
        cell.textContent = value;
      }
    });
  });
}

function addBook() {
  const title = prompt("Введите название книги:");
  if (title === null) return;

  const author = prompt("Введите автора книги:");
  const quantity = parseInt(prompt("Введите количество книг:"));
  const qr = confirm("Есть QR код?");
  const hasPaperVersion = confirm("Есть бумажная версия?");
  const location = prompt("Введите местоположение книги:");

  if (title && author && quantity && location) {
    const link = prompt("Ссылка на карту:");
    if (link.length > 0) {
      const newBook = {
        Название: title,
        Автор: author,
        Количество: quantity,
        QR: qr,
        НаличиеБумажнойВерсии: hasPaperVersion,
        Местоположение: [link],
      };

      const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
      books.push(newBook);
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));

      displayBooks(books); // Отображаем обновлённый список книг
    } else {
      alert("Добавьте ссылку!");
    }
  } else {
    alert("Заполните все поля!");
  }
}

function editBook() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];

  if (query.length) {
    const filteredBooks = books.filter(
      (book) =>
        book.Название.toLowerCase().includes(query) ||
        book.Автор.toLowerCase().includes(query)
    );

    if (filteredBooks.length === 1) {
      const bookToEdit = filteredBooks[0];
      if (confirm("Редактировать эту книгу " + bookToEdit.Название + " ?")) {
        const title = prompt(
          "Введите новое название книги:",
          bookToEdit.Название
        );
        const author = prompt("Введите нового автора книги:", bookToEdit.Автор);
        const quantity = parseInt(
          prompt("Введите новое количество книг:", bookToEdit.Количество)
        );
        const qr = confirm("Есть QR код?", bookToEdit.QR);
        const hasPaperVersion = confirm(
          "Есть бумажная версия?",
          bookToEdit.НаличиеБумажнойВерсии
        );
        const location = prompt(
          "Ссылка на карту:",
          bookToEdit.Местоположение[0]
        );

        const newBook = {
          Название: title,
          Автор: author,
          Количество: quantity,
          QR: qr,
          НаличиеБумажнойВерсии: hasPaperVersion,
          Местоположение: [location],
        };

        const index = books.indexOf(bookToEdit);
        if (index > -1) {
          books.splice(index, 1, newBook);
          localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
          displayBooks(books);
        }
      }
    } else {
      alert("Совпадений не найдено!");
    }
  } else {
    alert("Введите название книги в поле поиска.");
  }
}

function deleteBook() {
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  const query = document.getElementById("searchInput").value.trim().toLowerCase();

  if (query.length === 0) {
    alert("Введите название книги для удаления.");
    return;
  }

  const filteredBooks = books.filter(
    (book) => book.Название.toLowerCase() === query
  );

  if (filteredBooks.length > 1) {
    alert("Слишком много результатов");
  } else if (filteredBooks.length === 1) {
    const bookToDelete = filteredBooks[0];
    if (confirm("Удалить книгу " + bookToDelete.Название + "?")) {
      const index = books.indexOf(bookToDelete);
      if (index > -1) {
        books.splice(index, 1);
        localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
        displayBooks(books);
      }
    }
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
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  displayBooks(books);

  document.getElementById("delete-book").addEventListener("click", deleteBook);
  document.getElementById("searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    searchBook();
  });
  document.getElementById("addBookBtn").addEventListener("click", addBook);
  const editBookButton = document.querySelector(".edit-book");
  if (editBookButton) {
      editBookButton.addEventListener("click", editBook);
  }});

// admin/admin.js
const BOOKS_KEY = "books";
function logout() {
  window.location.href = "index.html";
}

function displayBooks(books) {
  const table = document.getElementById("bookTable");
  table.innerHTML = ""; // Очищаем таблицу перед добавлением новых данных

  // Заголовок таблицы
  const headerRow = table.insertRow();
  const headers = ["Название", "Автор", "Количество", "QR", "Местоположение"];
  headers.forEach((headerText) => {
    const header = headerRow.insertCell();
    header.textContent = headerText;
  });

  // Заполнение таблицы данными из books
  books.forEach((book) => {
    const row = table.insertRow();

    Object.values(book).forEach((text) => {
      if (typeof text === "boolean") {
        const cell = row.insertCell(); // Создаем ячейку
        const qrElement = document.createElement("div");

        if (text) {
          qrElement.innerHTML = '<ion-icon name="qr-code-outline"></ion-icon>';
        } else {
          qrElement.textContent = "false";
        }
        cell.appendChild(qrElement); // Добавляем элемент в ячейку
      } else if (typeof text === "string") {
        row.insertCell().textContent = text;
      } else if (typeof text === "object") {
        const link = text[0];

        const locationCell = row.insertCell();
        locationCell.innerHTML =
          '<ion-icon name="location-outline"></ion-icon>';
      } else if (typeof text === "number") {
        const cell = row.insertCell();
        cell.textContent = text;
        cell.style.color = "mediumseagreen";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || []; // Загружаем текущие книги из localStorage

  // Отображение массива books в таблице

  displayBooks(books);

  document
    .getElementById("searchForm")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // убираем перезагрузку
      searchbook();
    });
});

function searchbook() {
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
      // Показываем отфильтрованные книги в таблице

      displayBooks(filteredBooks);
    } else {
      alert("совпадений не найдено!");
    }
  }
}

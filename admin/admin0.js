const BOOKS_KEY = "books";
function edit() {
  window.location.href = "admin.html";
}

function displayBooks(books) {
  const table = document.getElementById("bookTable");
  table.innerHTML = "";

  const headerRow = table.insertRow();
  const headers = [
    "Название",
    "Автор",
    "Количество",
    "Электронная версия",
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

      if (key === "Электронная версия") {
        // Проверяем, есть ли значение для электронной версии
        if (value) {
          // Если есть, создаем ссылку
          const linkElement = document.createElement("a");
          linkElement.href = value;
          linkElement.textContent = "Ссылка"; // Или можно отобразить QR-код
          cell.appendChild(linkElement);
        } else {
          // Если нет, отображаем "Нет"
          cell.textContent = "Нет";
        }
      } else if (key === "Местоположение") {
        // Отображаем текст местоположения
        cell.textContent = value;
      } else {
        cell.textContent = value;
      }
    });
  });
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
function searchStudent() {
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  const query = document.getElementById("searchInput1").value.toLowerCase();

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
  document.getElementById("edit-book").addEventListener("click", edit);

  document.getElementById("searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    searchBook();
  });
  document.getElementById("searchForm1").addEventListener("submit", (event) => {
    event.preventDefault();
    searchStudent();
  });
});

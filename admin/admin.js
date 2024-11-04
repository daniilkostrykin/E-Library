const BOOKS_KEY = "books";
function logout() {
  window.location.href = "../index.html";
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
function addBook() {
  const title = prompt("Введите название книги:");
  const author = prompt("Введите автора книги:");
  const quantity = parseInt(prompt("Введите количество книг:"));
  const qr = confirm("Есть QR код?");
  const location = prompt("Введите местоположение книги:");

  if (title && author && quantity && location) {
    const link = prompt("Ссылка на карту:");

    if (link.length > 0) {
      //добавляет в массив обьект

      const newBook = {
        Название: title,
        Автор: author,
        Количество: quantity,
        QR: qr,
        Местоположение: [link],
      };

      // Загружаем текущие книги из localStorage
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
function editBook() {
  const query = document.getElementById("searchInput").value.toLowerCase();

  if (query.length) {
    const filteredBooks = books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
    );
    if (filteredBooks.length > 1) {
      alert("Слишком много результатов");
      return;
    } else if (filteredBooks.length === 1) {
      let i = 0;

      if (
        confirm("Редактировать эту книгу " + filteredBooks[0].Название + " ?")
      ) {
        // Получаем индекс редактируемой книги

        i = books.indexOf(filteredBooks[0]);
      } else return;

      const title = prompt(
        "Введите название книги:",
        filteredBooks[0].Название
      );
      const author = prompt("Введите автора книги:", filteredBooks[0].Автор);
      const quantity = parseInt(
        prompt("Введите количество книг:", filteredBooks[0].Количество)
      );
      const qr = confirm("Есть QR код?", filteredBooks[0].QR);
      const location = prompt(
        "Ссылка на карту:",
        filteredBooks[0].Местоположение[0]
      );

      const newbook = {
        Название: title,

        Автор: author,

        Количество: quantity,

        QR: qr,

        Местоположение: [location],
      };

      books.splice(i, 1, newbook);
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));

      displayBooks(books);
    } else {
      alert("совпадений не найдено!");
    }
  } else {
    alert("Введите название книги в поле поиска.");
    return;
  }
}

// Функция для удаления книги
function deleteBook() {
  const query = document.getElementById("searchInput").value.toLowerCase();

  if (query.length) {
    const filteredBooks = books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
    );

    if (filteredBooks.length > 1) {
      alert("Слишком много результатов");
      return;
    } else if (filteredBooks.length === 1) {
      if (confirm("Удалить книгу " + filteredBooks[0].Название + "?")) {
        const index = books.indexOf(filteredBooks[0]);

        if (index > -1) {
          // только если книга найдена

          books.splice(index, 1);

          localStorage.setItem(BOOKS_KEY, JSON.stringify(books));

          displayBooks(books);
        }
      }
      return;
    } else {
      alert("совпадений не найдено!");
    }
  } else {
    alert("Введите название книги в поле поиска.");
    return;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];

  const addBookButton = document.getElementById("addBookBtn");
  if (addBookButton) {
    addBookButton.addEventListener("click", addBook);
  }

  const deleteBookButton = document.getElementById("delete-book");

  if (deleteBookButton) {
    deleteBookButton.addEventListener("click", deleteBook);
  }

  // Обработчик редактирования книги
  document.getElementById("edit-book").addEventListener("click", function () {
    editBook();
  });
});

// ... (другие функции)

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
      displayBooks(filteredBooks);
    } else {
      // Если совпадений не найдено, очищаем таблицу

      alert("совпадений не найдено!");
    }
  }
}

const BOOKS_KEY = "books";
function logout() {
  window.location.href = "../index.html";
}
function displayBooks(books) {
  const table = document.getElementById("bookTable");
  table.innerHTML = ""; // Очищаем таблицу

  const headerRow = table.insertRow();
  const headers = ["Название", "Автор", "Количество", "QR", "Наличие бумажной версии", "Местоположение"];
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
        qrElement.innerHTML = value ? '<ion-icon name="qr-code-outline"></ion-icon>' : "Нет";
        cell.appendChild(qrElement);
      } else if (key === "НаличиеБумажнойВерсии") {
        cell.textContent = value ? "Да" : "Нет"; // Отображаем наличие бумажной версии
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
  if (title === null) {
    // Проверяем, нажал ли пользователь "Отмена"
    return; // Если да, выходим из функции, чтобы не выполнять дальнейшие действия
  }
  const author = prompt("Введите автора книги:");
  const quantity = parseInt(prompt("Введите количество книг:"));
  const qr = confirm("Есть QR код?");
  const hasPaperVersion = confirm("Есть бумажная версия?");
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
        НаличиеБумажнойВерсии: hasPaperVersion,
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
  const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || []; // Загружаем текущие книги из localStorage

  if (query.length) {
    // Фильтруем книги по названию или автору
    const filteredBooks = books.filter(
      (book) =>
        book.Название.toLowerCase().includes(query) ||
        book.Автор.toLowerCase().includes(query)
    );

    /*if (filteredBooks.length > 1) {
      alert("Слишком много результатов");
      return;
    } else*/ if (filteredBooks.length === 1) {
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
        const hasPaperVersion = confirm("Есть бумажная версия?", bookToEdit.НаличиеБумажнойВерсии); 
        const location = prompt(
          "Ссылка на карту:",
          bookToEdit.Местоположение[0]
        );

        // Создаем новый объект книги с обновленными данными
        const newBook = {
          Название: title,
          Автор: author,
          Количество: quantity,
          QR: qr,
          НаличиеБумажнойВерсии: hasPaperVersion,
          Местоположение: [location],
        };

        const index = books.indexOf(bookToEdit); // Получаем индекс редактируемой книги
        if (index > -1) {
          books.splice(index, 1, newBook); // Заменяем старую книгу на новую
          localStorage.setItem(BOOKS_KEY, JSON.stringify(books)); // Сохраняем обновленный массив книг в localStorage

          displayBooks(books); // Отображаем обновленный список книг
        }
      }
    } else {
      alert("Совпадений не найдено!");
    }
  } else {
    alert("Введите название книги в поле поиска.");
    return;
  }
}
// Функция для удаления книги
function deleteBook(books) {
    const query = document.getElementById("searchInput").value.trim().toLowerCase(); // Убираем пробелы и переводим в нижний регистр
  
    if (query.length === 0) {
      alert("Введите название книги для удаления.");
      return;
    }
  
    // Ищем книги по введенному названию
    const filteredBooks = books.filter(
      (book) => book.Название.toLowerCase() === query // Используем строгое сравнение для точного совпадения
    );
  
    if (filteredBooks.length > 1) {
      alert("Слишком много результатов");
      return;
    } else if (filteredBooks.length === 1) {
      const bookToDelete = filteredBooks[0]; // Книга, которую нужно удалить
  
      if (confirm("Удалить книгу " + bookToDelete.Название + "?")) {
        const index = books.indexOf(bookToDelete); // Находим индекс книги
  
        if (index > -1) {
          books.splice(index, 1); // Удаляем книгу из массива
          localStorage.setItem(BOOKS_KEY, JSON.stringify(books)); // Сохраняем обновленный массив книг в localStorage
          displayBooks(books); // Обновляем отображение таблицы
        }
      }
      return;
    } else {
      alert("Совпадений не найдено!");
    }
  }
  

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
document.addEventListener("DOMContentLoaded", () => {
  let books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];

  // Вызываем функцию, чтобы отрисовать таблицу сразу же при запуске страницы
  displayBooks(books);

  const deleteBookButton = document.getElementById("delete-book");
  if (deleteBookButton) {
    deleteBookButton.addEventListener("click", function () {
      deleteBook(books); // Передаем books в deleteBook
    });
  }

  document.getElementById("searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    searchbook();
  });

  const addBookButton = document.getElementById("addBookBtn");
  if (addBookButton) {
    addBookButton.addEventListener("click", addBook);
  }

  const editBookButton = document.getElementById("edit-book");
  if (editBookButton) {
    editBookButton.addEventListener("click", editBook);
  }
});

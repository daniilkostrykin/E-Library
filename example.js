function searchBook(event) {
    event.preventDefault();
    document.getElementById("booksTable").style.display = "none"; // изначально  скрываем  таблицу
    const searchInput = document
      .getElementById("searchInput")
      .value.trim()
      .toLowerCase();
  
    const booksTable = document.getElementById("booksTable");
    const resultContainer = document.getElementById("result");
    const booksTableBody = document.getElementById("booksTableBody");
  
    booksTableBody.innerHTML = "";
  
    const books = JSON.parse(localStorage.getItem(BOOKS_KEY)) || [];
  
    const filteredBooks = books.filter(
      (book) =>
        book.Название.toLowerCase().includes(searchInput) ||
        book.Автор.toLowerCase().includes(searchInput) ||
        String(book.Количество).includes(searchInput)
    );
  
    if (filteredBooks.length === 0) {
      resultContainer.innerHTML = "<p>Книги не найдены</p>";
  
      booksTable.style.display = "none"; // Скрываем, если ничего  не  найдено
    } else {
      resultContainer.innerHTML = ""; //  Очищаем  сообщение,  если  книги  найдены
  
      //!!!  Здесь добавляем строки в таблицу  !!!
      filteredBooks.forEach((book) => {
        const row = booksTableBody.insertRow(); // Создаем строку
  
        // Создаем  ячейки  и добавляем  их  в  строку
        const titleCell = row.insertCell();
        titleCell.textContent = book.Название;
  
        const authorCell = row.insertCell();
        authorCell.textContent = book.Автор;
  
        const countCell = row.insertCell();
        countCell.textContent = book.Количество;
  
        const actionsCell = row.insertCell();
        const takeButton = document.createElement("button"); //!!! Создаем  кнопку здесь!!!
        takeButton.textContent = "Взять";
  
        takeButton.addEventListener("click", () => {
          openTakeModal(book);
        });
        actionsCell.appendChild(takeButton); // Добавляем  кнопку в ячейку
  
        //Другие  действия
      });
  
      booksTable.style.display = "table"; // Отображаем таблицу  после заполнения
    }
  }
  function searchBook(event) {
    event.preventDefault(); // Отменяем перезагрузку страницы
    document.getElementById("booksTable").style.display = "none";
    const searchInput = document
      .getElementById("searchInput")
      .value.trim()
      .toLowerCase();
  
    const booksTable = document.getElementById("booksTable");
    const resultContainer = document.getElementById("result");
    const booksTableBody = document.getElementById("booksTableBody");
  
    booksTableBody.innerHTML = "";
  
    const books = JSON.parse(localStorage.getItem("books")) || [];
  
    const filteredBooks = books.filter((book) => {
      return (
        book["Название"].toLowerCase().includes(searchInput) ||
        book["Автор"].toLowerCase().includes(searchInput) ||
        String(book["Количество"]).includes(searchInput)
      );
    });
  
    if (filteredBooks.length === 0) {
      resultContainer.innerHTML = `<p>Книги не найдены</p>`;
      booksTable.style.display = "none";
    } else {
      resultContainer.innerHTML = ``;
      booksTable.style.display = "table";
  
      filteredBooks.forEach((book) => {
        const row = document.createElement("tr");
  
        // Название
        const nameCell = row.insertCell();
        nameCell.textContent = book["Название"];
  
        // Автор
        const authorCell = row.insertCell();
        authorCell.textContent = book["Автор"];
  
        // Количество
        const quantityCell = row.insertCell();
        quantityCell.textContent = book["Количество"];
  
        // Кнопка "Взять книгу"
        const actionCell = row.insertCell();
        actionCell.style.display = "flex";
        actionCell.style.justifyContent = "center";
        actionCell.style.alignItems = "center";
  
        const takeButton = document.createElement("button");
        takeButton.classList.add("action-button");
        takeButton.textContent = "Взять книгу";
        takeButton.style.backgroundColor = "rgb(41, 128, 185)";
        takeButton.style.color = "white";
        takeButton.style.border = "none";
        takeButton.style.padding = "8px 16px";
        takeButton.style.borderRadius = "10px";
        takeButton.style.fontFamily = "Montserrat, sans-serif";
  
        takeButton.addEventListener("click", () => {
          openTakeModal(book);
        });
        actionsCell.appendChild(takeButton); // Добавляем  кнопку в ячейку
  
        //Другие  действия
      });
  
      booksTable.style.display = "table"; // Отображаем таблицу  после заполнения
    }
  }
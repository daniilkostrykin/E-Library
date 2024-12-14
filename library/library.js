
const STUDENTS_KEY = "students";
const BOOKS_KEY = "books";
let students = [];
let isNotFoundMessageShown = false;
axios.defaults.baseURL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  await updateBookTable(); 

  handleSearchFormSubmit("searchForm", "searchInput", searchBook); 
  const bookSearchInput = document.getElementById("searchInput");
  const bookSearchButton = document.querySelector(".find");

  bookSearchInput.addEventListener("input", () => {
    bookSearchButton.value = bookSearchInput.value.trim()
      ? "Найти"
      : "Показать книги";
  });
  bookSearchButton.addEventListener("click", () => {
    searchBook();
  });
});

function back() {
  window.history.back();
}
function displayBooks(books) {
  const oldTable = document.getElementById("bookTable");
  if (oldTable) {
    oldTable.remove();
  }

  const adminPanel = document.getElementById("adminPanel");
  const table = document.createElement("table");
  table.id = "bookTable";
  adminPanel.appendChild(table);

  const headerRow = table.insertRow();
  const headers = [
    "Название",
    "Автор",
    "Количество",
    "Электронная версия",
   
  ];
  headers.forEach((headerText) => {
    const header = headerRow.insertCell();
    header.textContent = headerText;
  });

  if (!books || books.length === 0) {
    updateControlsMargin(false);

    
    displayMessage("Книга не найдена"); 
    return;
  }

  books.forEach((book) => {
    if (!Array.isArray(book)) {
      console.error("Invalid book data:", book);
      return; 
    }
    const row = table.insertRow();

    const titleCell = row.insertCell();
    titleCell.textContent = book[1] || ""; 

    const authorCell = row.insertCell();
    authorCell.textContent = book[2] || ""; 

    const quantityCell = row.insertCell();
    const quantity = book[3];
    quantityCell.textContent =
      quantity !== null && quantity !== undefined ? quantity : ""; 
    updateCellColor(quantityCell, quantity);

    const linkCell = row.insertCell();
    const linkValue = book[4];

    if (linkValue) {
      const linkElement = document.createElement("a");
      linkElement.href = linkValue;
      linkElement.target = "_blank";

      const tooltipText = document.createElement("span");
      tooltipText.classList.add("tooltiptext");
      tooltipText.textContent = "Открыть ссылку в новой вкладке";

      const bookIcon = document.createElement("ion-icon");
      bookIcon.name = "book";
      bookIcon.style.fontSize = "24px";
      bookIcon.style.color = "#8000ff";
      linkElement.appendChild(bookIcon);

      const tooltipContainer = document.createElement("div");
      tooltipContainer.classList.add("tooltip-container");
      tooltipContainer.appendChild(linkElement);
      tooltipContainer.appendChild(tooltipText);
      linkCell.appendChild(tooltipContainer);
    } else {
      linkCell.textContent = "Отсутствует";
      linkCell.style.color = "gray";
    }

     });

  const controls = document.getElementById("controls");
  adminPanel.insertBefore(table, controls);
  updateControlsMargin(true);
}


async function searchBook() {
  clearPreviousResults();
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

function displayMessage(messageText, formId = null) {
  clearPreviousResults();

  const adminPanel = document.getElementById("adminPanel");

  
  const messageContainer = document.createElement("div");
  messageContainer.id = "notFoundMessageContainer";
  messageContainer.style.display = "flex";
  messageContainer.style.justifyContent = "center";
  messageContainer.style.alignItems = "center";
  messageContainer.style.position = "absolute";
  messageContainer.style.top = "50%";
  messageContainer.style.left = "50%";
  messageContainer.style.transform = "translate(-50%, -50%)";
  messageContainer.style.textAlign = "center";

  
  const message = document.createElement("p");
  message.textContent = messageText;
  message.style.margin = "0";
  message.style.fontSize = "18px";
  message.style.color = "#333";

  
  messageContainer.appendChild(message);
  adminPanel.appendChild(messageContainer);

  isNotFoundMessageShown = true;
}

function clearPreviousResults() {
  
  const bookTable = document.getElementById("bookTable");
  if (bookTable) {
    bookTable.remove();
  }

  
  const studentsTable = document.getElementById("studentsTable");
  if (studentsTable) {
    studentsTable.remove();
  }

  
  const notFoundMessageContainer = document.getElementById(
    "notFoundMessageContainer"
  );
  if (notFoundMessageContainer) {
    notFoundMessageContainer.remove();
  }

  isNotFoundMessageShown = false;
}

function handleSearchFormSubmit(formId, inputId, searchFunction) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);

  if (!form || !input) {
    console.error(`Form or input not found: ${formId}, ${inputId}`);
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault(); 
    searchFunction(); 
  });

  input.addEventListener("input", () => {
    if (!input.value.trim()) {
      searchFunction(); 
    }
  });
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

    
    const bookTable = document.getElementById("bookTable");
    updateControlsMargin(bookTable !== null);
  });
function updateControlsMargin(hasData) {
  const controls = document.getElementById("controls");
  controls.style.marginTop = hasData ? "20px" : "400px";
}
function updateCellColor(cell, value) {
  const numValue = parseInt(value, 10);
  if (numValue > 0) {
    cell.style.color = "rgb(102, 191, 102)"; 
  } else if (numValue === 0) {
    cell.style.color = "red";
  }
}
function goToPersonalCabinet(student, index) {
  
  const fio = student.ФИО;

  const group = student.Группа;

  window.location.href = `../user/personalCabinet.html?fio=${encodeURIComponent(
    fio
  )}&group=${encodeURIComponent(group)}&id=${encodeURIComponent(index)}`;
  
}
async function fetchBooks(query = "") {
  try {
    const token = localStorage.getItem("token"); 

    const response = await axios.get("/api/books", {
      params: { query },
      headers: {
        Authorization: `Bearer ${token}`, 
      },
    });
    return response.data;
  } catch (error) {
    
    console.error("Ошибка при получении книг:", error);

    if (error.response && error.response.status === 401) {
      showToast("Сессия истекла. Пожалуйста, войдите снова.");

      logout(); 
    }

    throw error;
  }
}
async function updateBookTable() {
  const books = await fetchBooks();
  displayBooks(books);
}

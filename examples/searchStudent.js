// Функция для открытия модального окна
function openTakeModal(book) {
  if (isTakeModalOpen) {
    showToast("Вы уже пытаетесь взять книгу.");
    return;
  }
  bookToTake = book;
  document.getElementById(
    "takeBookMessage"
  ).textContent = `Вы уверены, что хотите взять книгу "${book[1]}"?`;
  document.getElementById("takeBookModal").style.display = "block";
  isTakeModalOpen = true; // Устанавливаем флаг
}
// Функция для подтверждения взятия книги
async function confirmTakeBook() {
  const urlParams = getURLParams();
  console.log("URL Params:", urlParams);

  let studentId;

  // Получаем studentId из параметров URL
  if (urlParams.id) {
    studentId = parseInt(urlParams.id, 10);
    console.log("Student ID:", studentId);
  }

  if (!bookToTake) {
    showToast("Ошибка: книга не выбрана.");
    closeTakeModal();
    return;
  }

  if (!studentId) {
    showToast("Ошибка: текущий студент не определен.");
    closeTakeModal();
    return;
  }

  console.log("Объект bookToTake:", bookToTake);

  try {
    // Получаем токен из localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Ошибка авторизации. Войдите в систему.");
      closeTakeModal();
      return;
    }

    // Fetch available books and the user's current borrowed books from the DB
    const [booksResponse, takenBooksResponse] = await Promise.all([
      axios.get("/api/books", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`/api/taken_books/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const books = booksResponse.data;
    const userBooksData = takenBooksResponse.data;

    // Ищем книгу в библиотеке по названию, используя индексы
    const bookInLibrary = books.find(
      (b) => b[1] === bookToTake[1] // bookToTake[0] - это название книги
    );
    console.log(bookInLibrary);

    if (!bookInLibrary || bookInLibrary[3] === 0) {
      // bookInLibrary[2] - это ID книги, если количество равно 0
      showToast("Эта книга в данный момент отсутствует.");
      closeTakeModal();
      return;
    }

    // Проверяем, взял ли студент уже эту книгу
    const bookAlreadyTaken = await checkIfBookTaken(
      studentId,
      bookToTake[1],
      token
    );
    if (bookAlreadyTaken) {
      showToast("Вы уже взяли эту книгу!");
      closeTakeModal();
      return;
    }

    // Рассчитываем дату возврата книги
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const formattedDueDate = dueDate.toISOString().split("T")[0]; // ISO формат даты

    // Добавляем книгу в список взятых книг студента
    userBooksData.books.push({
      id: bookInLibrary[0], // ID книги
      name: bookToTake[1], // Название книги
      author: bookToTake[2], // Автор книги
      dueDate: formattedDueDate, // Дата возврата
    });

    // Удаляем некорректные данные
    userBooksData.books = userBooksData.books.filter(
      (book) => book.name && book.author && book.dueDate
    );

    if (userBooksData.books.length === 0) {
      showToast("Нет корректных данных для отправки.");
      return;
    }

    // Отправляем обновленные данные о взятых книгах на сервер
    console.log("Отправка данных на сервер:", userBooksData);
    const response = await axios.post(
      `/api/taken_books/${studentId}`,
      userBooksData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Ответ сервера:", response.data);

    // Уменьшаем количество книги в библиотеке
    bookInLibrary[3]--; // Уменьшаем количество книги
    console.log("Обновление количества книг:", bookInLibrary);

    try {
      // Логируем данные перед отправкой запроса
      console.log(
        "Отправка запроса на обновление книги. Данные:",
        bookInLibrary
      );

      // Отправляем PUT-запрос для обновления данных о книге
      const bookResponse = await axios.post(
        `/api/books/${bookInLibrary[0]}`, // ID книги, который мы передаем
        bookInLibrary, // Данные о книге
        {
          headers: { Authorization: `Bearer ${token}` }, // Добавляем токен авторизации
        }
      );

      // Логируем успешный ответ
      console.log("Ответ сервера при обновлении книги:", bookResponse.data);
    } catch (error) {
      // Логируем ошибку, если что-то пошло не так
      console.error("Ошибка при обновлении книги:", error);

      // Дополнительный вывод ошибок
      if (error.response) {
        // Сервер вернул ответ с ошибкой
        console.error("Ответ от сервера:", error.response.data);
        console.error("Статус ответа:", error.response.status);
      } else if (error.request) {
        // Запрос был отправлен, но ответа не было
        console.error(
          "Запрос был отправлен, но не получен ответ:",
          error.request
        );
      } else {
        // Ошибка при настройке запроса
        console.error("Ошибка настройки запроса:", error.message);
      }
    }

    // Обновляем UI
    // Обновляем UI
    console.log(studentId);
    const bookList = document.querySelector(".book-list");
    bookList.style.display = "block"; // Показываем список книг
    if (!bookList) {
      throw new Error("Элемент '.book-list' не найден.");
    }
    await displayUserBooks(studentId); // Используйте studentId, чтобы UI обновился корректно
    updateBooksTable();
    updateUserDebtDisplay(studentId);

    showToast(`Книга "${bookToTake[1]}" успешно взята.`);
    closeTakeModal();
    bookToTake = null;
  } catch (error) {
    console.error(
      "Ошибка при подтверждении взятия книги:",
      error.response?.data || error.message
    );
    showToast("Произошла ошибка при взятии книги.");
    closeTakeModal();
  }
}
// Функция для закрытия модального окна
function closeTakeModal() {
  document.getElementById("takeBookModal").style.display = "none";
  isTakeModalOpen = false; // Устанавливаем флаг
}
// script.js
// Добавьте эту строку в начале вашего script.js
axios.defaults.baseURL = "http://localhost:3000";

const ACCOUNTS_KEY = "accounts";
const STUDENTS_KEY = "students";
const signUpButton = document.getElementById("signUp");
const signInOverlayButton = document.getElementById("signInOverlayButton");
const signInButton = document.getElementById("signInButton");
const container = document.getElementById("container");
const regForm = document.querySelector(".sign-up-container form");
const loginForm = document.querySelector(".sign-in-container form");
function forgotPassword() {
  window.location.href = "forgotPassword/mail.html";
}
//Обработчики событий переключения панели
signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");
});

signInOverlayButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
});

//Регистрация нового пользователя
async function createAccount(event) {
  event.preventDefault();

  const name = regForm.elements["reg-name"].value.trim();
  const group = regForm.elements["reg-group"].value.trim();
  const email = regForm.elements["reg-email"].value.trim();
  const password = regForm.elements["reg-password"].value;
  const confirmPassword = regForm.elements["reg-password-confirm"].value;

  if (!validateRegistration(name, group, email, password, confirmPassword))
    return;

  // Определение роли пользователя
  let role = "user"; // роль по умолчанию
  if (name.toLowerCase().includes("librarian")) {
    role = "librarian";
  } else if (name.toLowerCase().includes("admin")) {
    role = "admin";
  }

  try {
    // Создаем запись в таблице users
    const response = await axios.post("/api/auth/register", {
      name,
      group,
      email,
      password,
      role,
    });

    if (response.data.success) {
      const userId = response.data.userId; // Получаем ID нового пользователя

      // Если роль "user", добавляем запись в таблицу students
      if (role === "user") {
        await axios.post("/api/students", {
          user_id: userId,
          ФИО: name,
          группа: group,
          фото: null, // Можете заменить на URL фото или оставить пустым
        });
      }

      showToast("Аккаунт успешно создан!");
      regForm.reset();
      container.classList.remove("right-panel-active");

      // Автоматический вход после регистрации
      const loginResponse = await axios.post("/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", loginResponse.data.token);
      await getUserInfo(loginResponse.data.token);
      checkRole(); // Перенаправление по роли
    } else {
      showToast(response.data.message || "Ошибка регистрации");
    }
  } catch (error) {
    handleError(error, "Ошибка при регистрации пользователя");
  }
}

let students = [];
function updateStudentsInLocalStorage(newStudentData) {
  if (newStudentData.role !== "admin" && newStudentData.role !== "librarian") {
    let newStudent = {
      ФИО: newStudentData.name,
      Группа: newStudentData.group,
    };

    let nextStudentId = 1;
    const allAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
    if (allAccounts.length > 0) {
      // Получаем массив существующих ID, исключая `undefined` или `null`
      const existingIds = allAccounts
        .map((a) => a.id)
        .filter((id) => id != null);

      if (existingIds.length > 0) {
        nextStudentId = Math.max(...existingIds) + 1;
      }
    }

    newStudent.id = nextStudentId;

    students.push(newStudent);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));

    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
    const newAccount = accounts.find(
      (account) => account.email === newStudentData.email
    );

    if (newAccount) {
      newAccount.id = nextStudentId;
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }
  }
}

// Авторизация
signInButton.addEventListener("click", login);
async function login(event) {
  event.preventDefault();

  const email = loginForm.elements["email"].value.trim();
  const password = loginForm.elements["password"].value.trim();

  if (!email || !password) {
    showToast("Введите email и пароль!");
    return;
  }
  // Проверка для входа админа через 1 и 1
  if (email === "1" && password === "1") {
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const data = response.data;

      if (data.success && data.token) {
        localStorage.setItem("token", data.token); // Сохраняем токен
        await getUserInfo(data.token); // Загружаем данные пользователя
        checkRole(); // Перенаправляем пользователя
      } else {
        showToast(data.message || "Ошибка авторизации");
      }
    } catch (error) {
      handleError(error, "Ошибка при авторизации");
    }
    return; // Не продолжаем обычный процесс логина
  }
  try {
    const response = await axios.post("/api/auth/login", { email, password });
    const data = response.data;

    if (data.success && data.token) {
      localStorage.setItem("token", data.token); // Сохраняем токен
      await getUserInfo(data.token); // Загружаем данные пользователя
      checkRole(); // Перенаправляем пользователя
    } else {
      showToast(data.message || "Ошибка авторизации");
    }
  } catch (error) {
    handleError(error, "Ошибка при авторизации");
  }
}

function checkRoleMock() {
  const role = localStorage.getItem("mockRole"); // Получаем mock роль.

  if (role === "admin") {
    window.location.href = "admin/admin0.html";
  } else if (role === "librarian") {
    window.location.href = "librarian/librarian.html";
  }
}
async function getUserInfo(token) {
  try {
    const response = await axios.get("/api/auth/user-info", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = response.data;

    // Сохраняем данные пользователя
    localStorage.setItem("userData", JSON.stringify(userData));
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Если токен недействителен
      showToast("Сессия истекла. Выполните вход снова.");
      localStorage.removeItem("token");
      window.location.href = "index.html";
    } else {
      handleError(error, "Ошибка при получении данных пользователя");
    }
  }
}

// Функция обработки ошибок

function handleError(error, defaultMessage) {
  if (error.response) {
    showToast(error.response.data.message || defaultMessage);
  } else if (error.request) {
    showToast("Ошибка  сети. Попробуйте  позже.");
  } else {
    showToast("Ошибка  приложения.");
  }

  console.error(error); //  Логирование  ошибки в консоль
}

function validateRegistration(name, group, email, password, confirmPassword) {
  // Валидация имени
  const nameParts = name.trim().split(/\s+/); // Разделяем ФИО на части по пробелам

  if (nameParts.length < 2) {
    showToast("Пожалуйста, укажите полное имя и фамилию.");
    return false;
  }

  for (const part of nameParts) {
    if (part.length < 2 || part.length > 50) {
      showToast(
        "Каждое слово в имени и фамилии должно быть длиной от 2 до 50 символов. Проверьте ввод."
      );
      return false;
    }
  }

  // Валидация группы
  const groupRegex = /^[А-Я]{3}-\d{3}$/;

  if (!groupRegex.test(group)) {
    showToast(
      "Пожалуйста, укажите группу в формате XXX-123 (например, УВП-212)."
    );
    return false;
  }

  // Валидация почты
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    showToast(
      "Проверьте правильность написания email. Пример: example@mail.com"
    );
    return false;
  }

  // Валидация пароля
  const passwordRegex = /^(?=.*[A-Za-z])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    showToast(
      "Пароль должен быть не короче 8 символов и содержать хотя бы одну букву."
    );
    return false;
  }

  if (password !== confirmPassword) {
    showToast("Пароли не совпадают. Убедитесь, что ввели их одинаково.");
    return false;
  }

  return true;
}

async function checkRole() {
  // ... (остальной код)

  try {
    const userDataString = localStorage.getItem("userData");

    if (!userDataString) {
      // более надежная проверка. userDataString может быть и пустая строка
      //Обработка ситуации, когда данных о пользователе нет
      console.error("Данные пользователя не найдены в localStorage.");
      showToast("Ошибка авторизации. Попробуйте снова.");
      localStorage.removeItem("token"); // очищаем токен, т.к. авторизация провалена.
      return;
    }

    const userData = JSON.parse(userDataString).user; // <--- обращаемся к свойству .user

    if (userData.user) {
      userData = userData.user; // Если есть свойство user, то используем его
    }

    const fio = encodeURIComponent(userData.name);
    const group = encodeURIComponent(userData.group);

    if (userData.role === "admin") {
      window.location.href = "admin/admin0.html";
    } else if (userData.role === "librarian") {
      window.location.href = "librarian/librarian.html";
    } else {
      window.location.href = `user/personalCabinet.html?fio=${fio}&group=${group}&id=${userData.id}`;
      //  Важно убедиться, что 'userData' содержит корректную информацию до редиректа
    }
  } catch (e) {
    // обработать ошибку парсинга
    console.error("Ошибка обработки данных пользователя:", e);
    showToast("Ошибка обработки данных пользователя.");
  }
}

function getLoggedInAccount() {
  // Получаем email из localStorage (если есть, значит, залогинен)
  const loggedInEmail = localStorage.getItem("loggedInEmail");

  if (!loggedInEmail) return null;

  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
  return accounts.find((account) => account.email === loggedInEmail);
}
const regSubmitButton = document.getElementById("reg-submit");
regSubmitButton.addEventListener("click", createAccount);

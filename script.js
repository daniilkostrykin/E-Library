// script.js

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

  try {
    const response = await axios.post("/api/register", {
      name,
      group,
      email,
      password,
    });
    if (response.data.success) {
      showToast("Аккаунт успешно создан!");
      regForm.reset();
      container.classList.remove("right-panel-active");
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
    const photoPlaceholder = "/assets/img-placeholder.png";
    let newStudent = {
      Фото: photoPlaceholder,
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

  try {
    const response = await axios.post("/api/login", { email, password });
    const data = response.data;

    if (data.success && data.token) {
      localStorage.setItem("token", data.token); // Токен для последующих запросов
      showToast("Вы успешно вошли!");

      await getUserInfo(data.token); // Загружаем информацию о пользователе
      checkRole(); // Перенаправляем по роли
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
    const response = await axios.get("/api/user-info", {
      headers: {
        Authorization: `Bearer ${token}`, // Передача токена авторизации
      },
    });

    const userData = response.data;
    // Сохраняем роль и другую информацию для дальнейшего использования
    localStorage.setItem("userData", JSON.stringify(userData));
  } catch (error) {
    handleError(error, "Ошибка при получении данных пользователя");
  }
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

function checkRole() {
  const userData = JSON.parse(localStorage.getItem("userData"));

  if (!userData) {
    showToast("Ошибка: пользователь не найден");
    return;
  }

  if (userData.role === "admin") {
    window.location.href = "admin/admin0.html";
  } else if (userData.role === "librarian") {
    window.location.href = "librarian/librarian.html";
  } else {
    window.location.href = `user/personalCabinet.html?fio=${encodeURIComponent(
      userData.name
    )}&group=${encodeURIComponent(userData.group)}`;
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
/*автовход 
document.addEventListener("DOMContentLoaded", () => {
  checkRole();
});*/

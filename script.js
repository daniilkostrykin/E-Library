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
function createAccount(event) {
  event.preventDefault();
  const name = regForm.elements["reg-name"].value.trim();
  const group = regForm.elements["reg-group"].value.trim();
  const email = regForm.elements["reg-email"].value.trim();
  const password = regForm.elements["reg-password"].value;
  const confirmPassword = regForm.elements["reg-password-confirm"].value;

  if (!validateRegistration(name, group, email, password, confirmPassword))
    return;

  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];

  if (accounts.some((account) => account.email === email)) {
    alert("Аккаунт с таким email уже существует!");
    return;
  }
  let role = "user";
  if (name.toLowerCase().includes("librarian")) {
    role = "librarian";
  }
  if (email === "1" && password === "1") {
    role = "admin";
    const newAccount = { name, group, email, password, role };
    accounts.push(newAccount);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); // Сохраняем аккаунт админа

    localStorage.setItem("loggedInEmail", email); // Логиним админа
    checkRole(); // Перенаправляем в админ панель

    alert("Вход успешен!");
    regForm.reset();
    container.classList.remove("right-panel-active");

    return; // Останавливаем выполнение функции, чтобы не создавать обычный аккаунт
  }

  // Создаем обычный аккаунт:
  const newAccount = { name, group, email, password, role };
  accounts.push(newAccount);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

  updateStudentsInLocalStorage(newAccount);

  alert("Аккаунт успешно создан!");
  regForm.reset();
  container.classList.remove("right-panel-active");
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
function login(event) {
  event.preventDefault();

  const email = loginForm.elements["email"].value.trim();
  const password = loginForm.elements["password"].value.trim();

  if (!email || !password) {
    alert("Введите email и пароль!");
    return;
  }

  if (email === "1" && password === "1") {
    window.location.href = "admin/admin0.html";
    console.log("Вход в административную");
    return;
  }

  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];

  const account = accounts.find(
    (account) => account.email === email && account.password === password
  );

  if (account) {
    localStorage.setItem("loggedInEmail", account.email);
    alert("Вход успешен!");
    checkRole();

    return;
  } else {
    alert("Неверный email или пароль!");
  }
}
function validateRegistration(name, group, email, password, confirmPassword) {
  //валидация имени
  const nameParts = name.trim().split(/\s+/); // Разделяем ФИО на части по пробелам

  if (nameParts.length < 2) {
    alert("ФИО должно содержать минимум две части (имя и фамилию)!");
    return false;
  }

  for (const part of nameParts) {
    if (part.length < 2 || part.length > 50) {
      alert(
        "Каждая часть ФИО (имя, фамилия, отчество) должна содержать от 2 до 50 символов!"
      );
      return false;
    }
  }

  //валидация группы
  const groupRegex = /^[А-Я]{3}-\d{3}$/;

  if (!groupRegex.test(group)) {
    alert("Введите корректную группу");
    return false;
  }
  //валидация почты
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    alert("Введите корректный email");
    return false;
  }

  //Валидация пароля

  const passwordRegex = /^(?=.*[A-Za-z])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    alert("Пароль должен содержать минимум 8 символов");

    return false;
  }

  if (password !== confirmPassword) {
    alert("Пароли не совпадают!");
    return false;
  }

  return true;
}
function checkRole() {
  const account = getLoggedInAccount();

  if (!account) {
    return;
  }

  if (account.role === "admin") {
    window.location.href = "admin/admin0.html";
  } else if (account.role === "librarian") {
    window.location.href = "librarian/librarian.html";
  } else {
    window.location.href = `user/personalCabinet.html?fio=${encodeURIComponent(
      account.name
    )}&group=${encodeURIComponent(account.group)}&id=${encodeURIComponent(
      account.id
    )}`;
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

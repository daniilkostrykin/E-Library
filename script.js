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

  accounts.push({ name, group, email, password, role: "user" });
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  updateStudentsInLocalStorage({ name, group, email, role: "user" }); // Передаем только нужные данные

  alert("Аккаунт успешно создан!");
  regForm.reset(); //сбрасываем значения полей после регистрации
  container.classList.remove("right-panel-active"); //возвращаемся к форме авторизации
}
function updateStudentsInLocalStorage(newStudentData) {
  const photoPlaceholder = "/assets/img-placeholder.png";
  console.log("Путь к изображению (script.js):", photoPlaceholder);

  let newStudent = {
    // Объект в формате как для массива students
    Фото: photoPlaceholder, // Добавляем плейсхолдер для фото
    ФИО: newStudentData.name, // Обратите внимание на правильное имя поля
    Группа: newStudentData.group, // group
  };
  console.log("newStudent:", newStudent);

  // Считываем текущих студентов
  let students = JSON.parse(localStorage.getItem(STUDENTS_KEY)) || [];

  students.push(newStudent); // Добавляем данные нового студента

  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students)); // Сохраняем
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
  const account = getLoggedInAccount(); //  Функция для получения данных текущего пользователя (см. ниже)

  if (!account) {
    // Пользователь не залогинен
    //  .. логика отображения  формы входа...
    alert("Пользователь не залогинен");
    return;
  } else if (account.role === "admin") {
    window.location.href = "admin/admin0.html";
  } else if (account.role === "librarian") {
    window.location.href = "librarian/librarian0.html"; //  Создай новую папку librarian
  } else {
    window.location.href = 'user/personalCabinet.html';
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

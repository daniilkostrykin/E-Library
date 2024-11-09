// script.js
const ACCOUNTS_KEY = "accounts";

const signUpButton = document.getElementById("signUp");
const signInOverlayButton = document.getElementById("signInOverlayButton");
const signInButton = document.getElementById("signInButton");
const container = document.getElementById("container");
const regForm = document.querySelector(".sign-up-container form");
const loginForm = document.querySelector(".sign-in-container form");

//Обработчики событий переключения панели
signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");
});

signInOverlayButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
});

//Регистрация нового пользователя
function createAccount(event) {
  //отменяем стандартное поведение формы
  event.preventDefault();

  const name = regForm.elements["reg-name"].value.trim();
  const email = regForm.elements["reg-email"].value.trim();
  const password = regForm.elements["reg-password"].value;
  const confirmPassword = regForm.elements["reg-password-confirm"].value;

  if (!validateRegistration(name, email, password, confirmPassword)) return;

  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];

  if (accounts.some((account) => account.email === email)) {
    alert("Аккаунт с таким email уже существует!");
    return;
  }

  accounts.push({ name, email, password });
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

  alert("Аккаунт успешно создан!");
  regForm.reset(); //сбрасываем значения полей после регистрации
  container.classList.remove("right-panel-active"); //возвращаемся к форме авторизации
}

function validateRegistration(name, email, password, confirmPassword) {
  //валидация имени
  if (name.length < 2 || name.length > 50) {
    alert("Имя должно содержать от 2 до 50 символов!");
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
    window.location.href = "admin/admin.html";
    console.log("Вход в административную");

    return;
  }

  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];

  const account = accounts.find(
    (account) => account.email === email && account.password === password
  );

  if (account) {
    alert("Вход успешен!");
    // Здесь можно добавить дальнейшие действия, например, перенаправление
  } else {
    alert("Неверный email или пароль!");
  }
}
const regSubmitButton = document.getElementById("reg-submit"); //  Или другой селектор для кнопки
regSubmitButton.addEventListener("click", createAccount); // <---  Без скобок!

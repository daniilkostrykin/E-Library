const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");

signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");
});

signInButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
});/*
// Инициализация Google API (Замените YOUR_GOOGLE_CLIENT_ID на ваш Client ID)
gapi.load("auth2", () => {
  gapi.auth2.init({ client_id: "YOUR_GOOGLE_CLIENT_ID" });
});

// Инициализация VK API (Замените YOUR_VK_APP_ID на ваш App ID)
VK.init({ apiId: "YOUR_VK_APP_ID" });
function googleSignIn() {
  const googleAuth = gapi.auth2.getAuthInstance(); // Убедитесь, что gapi загружена
  googleAuth
    .signIn()
    .then((googleUser) => { 
      const profile = googleUser.getBasicProfile();
      const idToken = googleUser.getAuthResponse().id_token;

      // Отправьте idToken на ваш сервер для верификации и создания сессии
      fetch("/your-backend-auth-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
      })
        .then((response) => response.json())
        .then((data) => {
          // Обработайте ответ сервера (например, редирект на защищенную страницу)
          console.log("Успешная авторизация Google:", data);
        })
        .catch((error) => {
          console.error("Ошибка авторизации Google:", error);
        });
    })
    .catch((error) => {
      console.error("Ошибка входа Google:", error);
    });
}

function vkSignIn() {
  VK.Auth.login(function (response) {
    if (response.session) {
      // access_token получен, отправьте его на сервер для верификации
      fetch("/your-backend-auth-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: response.session.access_token }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Успешная авторизация VK:", data);
        })
        .catch((error) => {
          console.error("Ошибка авторизации VK:", error);
        });
    } else {
      console.error("Авторизация VK отклонена");
    }
  }, 2); // 2 - запрос прав на доступ к email
}*/
// script.js
// Создаем ключ для хранения аккаунтов в localStorage
const ACCOUNTS_KEY = "accounts";

// Функция для добавления нового аккаунта
function createAccount() {
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    // Проверка на пустые поля
    if (!name || !email || !password) {
        alert("Заполните все поля!");
        return;
    }

    // Загружаем текущие аккаунты из localStorage
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];

    // Проверка на существующий email
    if (accounts.some(account => account.email === email)) {
        alert("Аккаунт с таким email уже существует!");
        return;
    }

    // Добавляем новый аккаунт в массив и сохраняем его в localStorage
    accounts.push({ name, email, password });
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

    alert("Аккаунт успешно создан!");
}

// Функция для поиска аккаунта (вход в систему)
function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Проверка на пустые поля
    if (!email || !password) {
        alert("Введите email и пароль!");
        return;
    }

    // Загружаем текущие аккаунты из localStorage
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
    if (email === "1" && password === "1") {
        // Перенаправляем на страницу администратора
        window.location.href = "../admin/admin.html"; 
    } else {
        // Проверка наличия аккаунта с соответствующими email и паролем
        const account = accounts.find(account => account.email === email && account.password === password);

        if (account) {
            alert("Вход успешен!");
            // Здесь можно добавить дальнейшие действия, например, перенаправление
        } else {
            alert("Неверный email или пароль!");
        }
    }}
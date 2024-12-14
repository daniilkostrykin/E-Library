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
signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");
});

signInOverlayButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
});

const forgotPasswordLink = document.getElementById("forgotPassword");
forgotPasswordLink.addEventListener("click", function (event) {
  event.preventDefault();
  window.location.href = "forgotPassword/mail.html";
});

async function createAccount(event) {
  event.preventDefault();

  const name = regForm.elements["reg-name"].value.trim();
  const group = regForm.elements["reg-group"].value.trim();
  const email = regForm.elements["reg-email"].value.trim();
  const password = regForm.elements["reg-password"].value;
  const confirmPassword = regForm.elements["reg-password-confirm"].value;

  if (!validateRegistration(name, group, email, password, confirmPassword))
    return;

  let role = "user";
  if (name.toLowerCase().includes("librarian")) {
    role = "librarian";
  } else if (name.toLowerCase().includes("admin")) {
    role = "admin";
  }

  try {
    const response = await axios.post("/api/auth/register", {
      name,
      group,
      email,
      password,
      role,
    });

    if (response.data.success) {
      const userId = response.data.userId;

      showToast("Аккаунт успешно создан!");
      regForm.reset();
      container.classList.remove("right-panel-active");

      const loginResponse = await axios.post("/api/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", loginResponse.data.token);
      await getUserInfo(loginResponse.data.token);
      checkRole();
    } else {
      showToast(response.data.message || "Ошибка регистрации");
    }
  } catch (error) {
    handleError(error, "Ошибка при регистрации пользователя");
  }
}
signInButton.addEventListener("click", login);
async function login(event) {
  event.preventDefault();

  const email = loginForm.elements["email"].value.trim();
  const password = loginForm.elements["password"].value.trim();

  if (!email || !password) {
    showToast("Введите email и пароль!");
    return;
  }
  if (email === "1" && password === "1") {
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const data = response.data;

      if (data.success && data.token) {
        localStorage.setItem("token", data.token);
        await getUserInfo(data.token);
        checkRole();
      } else {
        showToast(data.message || "Ошибка авторизации");
      }
    } catch (error) {
      handleError(error, "Ошибка при авторизации");
    }
    return;
  }
  try {
    const response = await axios.post("/api/auth/login", { email, password });
    const data = response.data;

    if (data.success && data.token) {
      localStorage.setItem("token", data.token);
      await getUserInfo(data.token);
      checkRole();
    } else {
      showToast(data.message || "Ошибка авторизации");
    }
  } catch (error) {
    handleError(error, "Ошибка при авторизации");
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

    localStorage.setItem("userData", JSON.stringify(userData));
  } catch (error) {
    if (error.response && error.response.status === 401) {
      showToast("Сессия истекла. Выполните вход снова.");
      localStorage.removeItem("token");
      window.location.href = "index.html";
    } else {
      handleError(error, "Ошибка при получении данных пользователя");
    }
  }
}

function handleError(error, defaultMessage) {
  if (error.response) {
    showToast(error.response.data.message || defaultMessage);
  } else if (error.request) {
    showToast("Ошибка  сети. Попробуйте  позже.");
  } else {
    showToast("Ошибка  приложения.");
  }

  console.error(error);
}

function validateRegistration(name, group, email, password, confirmPassword) {
  const nameParts = name.trim().split(/\s+/);

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

  const groupRegex = /^[А-Я]{3}-\d{3}$/;

  if (!groupRegex.test(group)) {
    showToast(
      "Пожалуйста, укажите группу в формате XXX-123 (например, УВП-212)."
    );
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    showToast(
      "Проверьте правильность написания email. Пример: example@mail.com"
    );
    return false;
  }

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
  try {
    const userDataString = localStorage.getItem("userData");

    if (!userDataString) {
      console.error("Данные пользователя не найдены в localStorage.");
      showToast("Ошибка авторизации. Попробуйте снова.");
      localStorage.removeItem("token");
      return;
    }

    const userData = JSON.parse(userDataString).user;

    if (userData.user) {
      userData = userData.user;
    }

    const fio = encodeURIComponent(userData.name);
    const group = encodeURIComponent(userData.group);

    if (userData.role === "admin") {
      window.location.href = "admin/admin0.html";
    } else if (userData.role === "librarian") {
      window.location.href = "admin/admin0.html";
    } else {
      window.location.href = `user/personalCabinet.html?fio=${fio}&group=${group}&id=${userData.id}`;
    }
  } catch (e) {
    console.error("Ошибка обработки данных пользователя:", e);
    showToast("Ошибка обработки данных пользователя.");
  }
}

function getLoggedInAccount() {
  const loggedInEmail = localStorage.getItem("loggedInEmail");

  if (!loggedInEmail) return null;

  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
  return accounts.find((account) => account.email === loggedInEmail);
}
const regSubmitButton = document.getElementById("reg-submit");
regSubmitButton.addEventListener("click", createAccount);

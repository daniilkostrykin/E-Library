axios.defaults.baseURL = "http://localhost:3000";

document
  .getElementById("signInButton")
  .addEventListener("click", async function (event) {
    event.preventDefault();

    const emailInput = document.getElementById("email");
    const email = emailInput.value.trim();

    if (email === "") {
      showToast("Пожалуйста, введите адрес электронной почты.");
      emailInput.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showToast("Пожалуйста, введите корректный адрес электронной почты.");
      return;
    }

    try {
      const exists = await checkAccountExists(email);
      if (exists) {
        await sendResetPasswordEmail(email);
        showToast("Ссылка для восстановления пароля отправлена на ваш email.");
        setTimeout(() => {
          window.location.href = "sendLetter.html";
        }, 2000);
      } else {
        showToast(
          "Пользователь с таким email не найден. Пожалуйста, зарегистрируйтесь!"
        );
        setTimeout(() => {}, 3000);
      }
    } catch (error) {
      console.error("Ошибка обработки восстановления пароля:", error);
      showToast("Произошла ошибка. Попробуйте позже.");
    }
  });

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function checkAccountExists(email) {
  try {
    const response = await axios.get("/api/accounts", { params: { email } });
    return response.data.exists;
  } catch (error) {
    console.error("Ошибка при проверке существования аккаунта:", error);
    return false;
  }
}

async function sendResetPasswordEmail(email) {
  try {
    const response = await axios.post("/api/auth/reset-password", { email });
    return response.data.success;
  } catch (error) {
    console.error("Ошибка отправки email для восстановления пароля:", error);
    throw error;
  }
}

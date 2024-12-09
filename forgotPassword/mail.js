axios.defaults.baseURL = "http://localhost:3000";

document
  .getElementById("signInButton")
  .addEventListener("click", async function (event) {
    event.preventDefault(); // Предотвращаем отправку формы

    const emailInput = document.getElementById("email");
    const email = emailInput.value.trim(); // Убираем пробелы в начале и конце

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
        await sendResetPasswordEmail(email); // Отправляем ссылку на восстановление пароля
        showToast("Ссылка для восстановления пароля отправлена на ваш email.");
        setTimeout(() => {
          window.location.href = "sendLetter.html";
        }, 2000);
      } else {
        showToast(
          "Пользователь с таким email не найден. Пожалуйста, зарегистрируйтесь!"
        );
        setTimeout(() => {
          //window.location.href = "../index.html";
        }, 3000);
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
    const response = await axios.get('/api/accounts', { params: { email } }); 
    return response.data.exists; // Предполагается, что сервер возвращает { exists: true/false }
  } catch (error) {
    console.error("Ошибка при проверке существования аккаунта:", error);
    return false;
  }
}

async function sendResetPasswordEmail(email) {
  try {
    const response = await axios.post('/api/auth/reset-password', { email });
    return response.data.success;
  } catch (error) {
    console.error("Ошибка отправки email для восстановления пароля:", error);
    throw error;
  }
}

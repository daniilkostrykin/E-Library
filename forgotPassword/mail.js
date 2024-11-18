document
  .getElementById("signInButton")
  .addEventListener("click", function (event) {
    event.preventDefault(); // Предотвращаем отправку формы

    const emailInput = document.getElementById("email");
    const email = emailInput.value.trim(); // Убираем пробелы в начале и конце

    if (email === "") {
      showToast("Пожалуйста, введите адрес электронной почты.");
      emailInput.focus();
    } else if (!isValidEmail(email)) {
      showToast("Пожалуйста, введите корректный адрес электронной почты.");
    } else if (checkAccountExists(email)) {
      window.location.href = "sendLetter.html";
    } else {
      showToast(
        "Пользователь с таким email не найден. Пожалуйста, зарегистрируйтесь!"
      );
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 3000);
    }
  });

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function checkAccountExists(email) {
  const accounts = JSON.parse(localStorage.getItem("accounts")) || [];

  return accounts.some((account) => account.email === email);
}

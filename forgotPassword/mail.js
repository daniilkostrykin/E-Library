document
  .getElementById("signInButton")
  .addEventListener("click", function (event) {
    event.preventDefault(); // Предотвращаем отправку формы

    const emailInput = document.getElementById("email");
    const email = emailInput.value.trim(); // Убираем пробелы в начале и конце

    if (email === "") {
      alert("Пожалуйста, введите адрес электронной почты.");
      emailInput.focus();
    } else if (!isValidEmail(email)) {
      alert("Пожалуйста, введите корректный адрес электронной почты.");
    } else if (checkAccountExists(email)) {
      window.location.href = "sendLetter.html";
    } else {
      alert(
        "Пользователь с таким email не найден. Пожалуйста, зарегистрируйтесь!"
      );
      window.location.href = "../index.html";
    }
  });

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function checkAccountExists(email) {
  const accounts = JSON.parse(localStorage.getItem("accounts")) || [];

  return accounts.some((account) => account.email === email);
}

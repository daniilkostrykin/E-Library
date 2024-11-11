document
  .getElementById("signInButton")
  .addEventListener("click", function (event) {
    event.preventDefault(); // Предотвращаем отправку формы

    const emailInput = document.getElementById("email");
    const email = emailInput.value.trim(); // Убираем пробелы в начале и конце

    if (email === "") {
      alert("Пожалуйста, введите адрес электронной почты.");
      emailInput.focus(); // Фокус на поле ввода email
    } else if (!isValidEmail(email)) {
      // <---  Добавляем проверку на валидность
      alert("Пожалуйста, введите корректный адрес электронной почты.");
    } else {
      window.location.href = "sendLetter.html";
    }
  });

function isValidEmail(email) {
  // Функция проверки валидности email (простая)
  // Простая проверка на наличие @ и точки
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

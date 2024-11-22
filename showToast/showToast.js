function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);
  //  Скрываем toast  через 3 секунды
  setTimeout(() => {
    toast.classList.remove("show"); // Сначала делаем прозрачным
    setTimeout(() => {
      // А потом удаляем
      container.removeChild(toast);
    }, 300);
  }, 3000);
}
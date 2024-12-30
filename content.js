chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.text) {
    navigator.clipboard
      .writeText(request.text)
      .then(() => {
        autoCloseAlert(`${request.text}`, 2000);
      })
      .catch((err) => {});
  }
});

function autoCloseAlert(message, duration) {
  const alertBox = document.createElement("div");
  alertBox.style.position = "fixed";
  alertBox.style.top = "15%";
  alertBox.style.left = "50%";
  alertBox.style.transform = "translateX(-50%)";
  alertBox.style.padding = "5px 10px";
  alertBox.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  alertBox.style.maxWidth = "80%";
  alertBox.style.color = "#fff";
  alertBox.style.fontSize = "14px";
  alertBox.style.borderRadius = "4px";
  alertBox.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.1)";
  alertBox.innerText = message;
  document.body.appendChild(alertBox);

  setTimeout(() => {
    document.body.removeChild(alertBox);
  }, duration);
}

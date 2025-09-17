chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.text) {
    autoCloseAlert(`${request.text}`, 2000);
    if (request.copy) {
      navigator.clipboard.writeText(request.text).catch((err) => {});
    }
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

document.addEventListener("mouseup", (event) => {
  const selectedText = window.getSelection().toString().trim();
  const tooltipId = "selection-tooltip";
  let tooltip = document.getElementById(tooltipId);

  // 如果没有选中任何文本或选中的是空格，则隐藏 tooltip
  if (!selectedText) {
    if (tooltip) {
      tooltip.style.display = "none";
    }
    return;
  }

  // 如果 tooltip 不存在，则创建它
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = tooltipId;
    tooltip.style.cssText = `
      position: absolute;
      background-color: #333;
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 99999;
      font-family: sans-serif;
      font-size: 10px;
      cursor: pointer;
      display: flex;
      gap: 10px;
    `;
    document.body.appendChild(tooltip);
  }

  // 更新 tooltip 的内容和位置
  tooltip.innerHTML = `
    <span class="tooltip-option" data-action="google">搜索</span>
  `;
  tooltip.style.display = "flex";
  tooltip.style.left = `${event.pageX}px`;
  tooltip.style.top = `${event.pageY + 15}px`;

  // 监听 tooltip 内部的点击事件
  tooltip.addEventListener(
    "click",
    (e) => {
      const action = e.target.dataset.action;
      if (action === "google") {
        window.open(
          `https://www.google.com/search?q=如何理解： ${encodeURIComponent(
            selectedText
          )}`,
          "_blank"
        );
      }
      // 点击后隐藏 tooltip
      tooltip.style.display = "none";
    },
    { once: true }
  ); // 使用 once: true 确保事件监听器只执行一次
});

// 在用户点击其他地方时隐藏 tooltip
document.addEventListener("mousedown", (event) => {
  const tooltip = document.getElementById("selection-tooltip");
  if (tooltip && !tooltip.contains(event.target)) {
    tooltip.style.display = "none";
  }
});

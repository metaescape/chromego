function isTimeInAllowedRange() {
  const now = new Date();
  const currentHour = now.getHours();
  return true; // Always return true for now
}

function sendToPython(text) {
  // 构造请求 URL，注意编码 content 参数以处理特殊字符和中文
  const serverUrl = `http://127.0.0.1:9090/note?content=${encodeURIComponent(
    text
  )}`;

  fetch(serverUrl, {
    method: "GET", // 对应 Python 的 do_GET
    mode: "cors", // 跨域模式
  })
    .then((response) => {
      if (response.ok) {
        console.log("成功发送到 Python 端");
      }
    })
    .catch((error) => {
      console.error("发送失败，请检查 Python 服务是否启动:", error);
    });
}

export { isTimeInAllowedRange, sendToPython };

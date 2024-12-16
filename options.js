document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get("blockedPatterns", (data) => {
    if (data.blockedPatterns) {
      document.getElementById("blockedPatterns").value = data.blockedPatterns;
    }
  });

  let timeout;
  document.getElementById("blockedPatterns").addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const patterns = document.getElementById("blockedPatterns").value;
      chrome.storage.sync.set({ blockedPatterns: patterns });
    }, 1000); // 1 second delay
  });

  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "/") {
      event.preventDefault();
      const textarea = document.getElementById("blockedPatterns");
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const lines = textarea.value.split("\n");
      let startLine = textarea.value.substr(0, start).split("\n").length - 1;
      let endLine = textarea.value.substr(0, end).split("\n").length - 1;

      for (let i = startLine; i <= endLine; i++) {
        if (lines[i].startsWith("#")) {
          lines[i] = lines[i].substring(2).trimStart();
        } else {
          lines[i] = "# " + lines[i];
        }
      }

      textarea.value = lines.join("\n");
      textarea.setSelectionRange(start, end);
      chrome.storage.sync.set({ blockedPatterns: textarea.value });
    }
  });
});

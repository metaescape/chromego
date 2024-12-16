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
});

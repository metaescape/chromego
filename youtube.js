function applyYouTubeSettings(enabled) {
  if (enabled) {
    document.documentElement.setAttribute("hide", "true");
  } else {
    document.documentElement.removeAttribute("hide");
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    // get html element
    applyYouTubeSettings(changes.enableRules.newValue);
  }
});

// after dom loaded
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["enableRules"], function (result) {
    const settings = result.enableRules || false;
    applyYouTubeSettings(settings);
  });
});

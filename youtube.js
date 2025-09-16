function applyYouTubeSettings(enabled) {
  if (enabled) {
    document.documentElement.setAttribute("hide", "true");
  } else {
    document.documentElement.removeAttribute("hide");
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    // get html element
    applyYouTubeSettings(changes.enableRules.newValue);
  }
});

// after dom loaded
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["enableRules"], function (result) {
    const settings = result.enableRules || false;
    applyYouTubeSettings(settings);
  });
});

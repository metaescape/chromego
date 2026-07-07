// copied from https://github.com/jiexiangfan/ProductivitiBili/blob/main/bilibili.js

// Define the sections and their respective CSS selectors
const sections = {
  douyin: ["#douyin-navigation"],
};

// Apply existing settings to the current tab
chrome.storage.local.get(["enableRules"], function (result) {
  const settings = result.enableRules || {};
  applySettings(settings);
});

// Apply the settings to the sections based on the selected options
function applySettings(enabled) {
  let css = "";
  Object.entries(sections).forEach(([section, selectors]) => {
    // console.log("Applying settings for section:", section);
    const setting = enabled ? "hide" : "show"; // Default to "show" if not specified
    selectors.forEach((selector) => {
      css += generateCSS(selector, setting);
    });
  });
  injectStyles(css);
}

// Generate CSS for a given selector and setting
function generateCSS(selector, setting) {
  const styleMap = {
    hide: `display: none !important;`,
    blur: `filter: blur(5px) !important; display: initial !important;`,
    show: `filter: none !important; display: initial !important;`, // Ensure visibility is enforced
  };
  return `${selector} { ${styleMap[setting] || ""} }\n`;
}

// Inject styles into the document
function injectStyles(css) {
  // Remove existing styles to avoid duplication
  let styleElement = document.getElementById("custom-douyin-styles");
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.type = "text/css";
    styleElement.id = "custom-douyin-styles";
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = css;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    applySettings(changes.enableRules ? changes.enableRules.newValue : false);
  }
});

// after dom loaded
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["enableRules"], function (result) {
    const settings = result.enableRules || false;
    applySettings(settings);
  });
});

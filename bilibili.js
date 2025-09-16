// copied from https://github.com/jiexiangfan/ProductivitiBili/blob/main/bilibili.js

// Define the sections and their respective CSS selectors
const sections = {
  bilibiliHome: [
    ".bili-feed4-layout",
    ".header-channel-fixed",
    ".bili-footer",
    ".international-footer",
  ],
  bilibiliSidebar: [
    "#reco_list",
    "#right-bottom-banner",
    "#live_recommand_report",
    ".pop-live-small-mode",
    "#danmukuBox",
    ".video-card-ad-small",
    ".recommend-list-v1",
    ".ad-report",
    ".ad-floor-exp",
  ],
  bilibiliUpNext: [
    ".bpx-player-ending-content",
    ".bpx-player-ending-related",
    ".bilibili-player-ending-panel-box-videos",
  ],
  bilibiliComments: [
    "#comment",
    ".bili-footer",
    ".international-footer",
    "#activity_vote",
    ".inside-wrp",
    "#commentapp",
  ],
  bilibiliSubscription: [
    ".bili-dyn-list-tabs",
    ".bili-dyn-list",
    ".bili-footer",
    ".international-footer",
    ".bili-dyn-topic-box",
    ".bili-dyn-up-list",
  ],
  bilibiliTrending: [
    ".popular-container",
    ".popular-video-container",
    ".bili-footer",
    ".international-footer",
    // ".channel-link", // these 3 are the buttons in the header of hompage
    // ".channel-link__right",
    // ".channel-entry-more__link",
  ],
  bilibiliDanmuku: [".bpx-player-row-dm-wrap"],
};

// Apply existing settings to the current tab
chrome.storage.sync.get(["enableRules"], function (result) {
  const settings = result.bilibiliSettings || {};
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
  let styleElement = document.getElementById("custom-bilibili-styles");
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.type = "text/css";
    styleElement.id = "custom-bilibili-styles";
    document.head.appendChild(styleElement);
  }
  styleElement.textContent = css;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.enableRules) {
    applySettings(changes.enableRules.newValue);
  }
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  applySettings(changes.enableRules.newValue);
});

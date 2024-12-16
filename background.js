chrome.commands.onCommand.addListener((command) => {
  if (command === "save_title_and_url") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const data = {
        title: tab.title,
        url: tab.url,
      };

      // connect to content.js
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ["content.js"],
        },
        () => {
          chrome.tabs.sendMessage(tab.id, {
            text: `[[${data.url}][${data.title}]]`,
          });
        }
      );
    });
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
});

let blockedPatternsRaw = "";
let parsedBlockedPatterns = [];

function parseBlockedPatterns(rawPatterns) {
  return rawPatterns.split("\n").map((pattern) => {
    const [patternStr, redirectUrl] = pattern
      .split("->")
      .map((str) => str.trim());
    const absoluteRedirectUrl =
      redirectUrl && redirectUrl.startsWith("http")
        ? redirectUrl
        : redirectUrl
        ? `https://${redirectUrl}`
        : "about:blank";
    return { pattern: new RegExp(patternStr), redirect: absoluteRedirectUrl };
  });
}

chrome.storage.sync.get("blockedPatterns", (data) => {
  if (data.blockedPatterns) {
    blockedPatternsRaw = data.blockedPatterns;
    parsedBlockedPatterns = parseBlockedPatterns(blockedPatternsRaw);
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.blockedPatterns) {
    blockedPatternsRaw = changes.blockedPatterns.newValue;
    parsedBlockedPatterns = parseBlockedPatterns(blockedPatternsRaw);
  }
});

chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    console.log(details.url);
    const rule = parsedBlockedPatterns.find((rule) =>
      rule.pattern.test(details.url)
    );
    if (rule) {
      chrome.tabs.update(details.tabId, {
        url: rule.redirect,
      });
    }
  },
  { url: [{ urlMatches: ".*" }] }
);

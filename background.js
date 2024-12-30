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
let currentTarget = "about:blank";

function parseBlockedPatterns(rawPatterns) {
  currentTarget = "about:blank"; // Reset currentTarget at the start of parsing
  return rawPatterns
    .split("\n")
    .filter((pattern) => {
      return pattern.trim() !== "" && !pattern.trim().startsWith("#");
    })
    .map((pattern) => {
      const [patternStr, redirectUrl] = pattern
        .split("->")
        .map((str) => str.trim());
      const targetUrl = getAbsoluteUrl(redirectUrl) ?? currentTarget;
      currentTarget = targetUrl;
      return {
        pattern: new RegExp(patternStr),
        redirect: targetUrl,
      };
    });
}

function getAbsoluteUrl(url) {
  if (!url) {
    return undefined;
  }
  if (
    url.startsWith("about:") ||
    url.startsWith("chrome:") ||
    url.startsWith("file:") ||
    url.startsWith("http")
  ) {
    return url;
  }
  return `https://${url}`;
}

chrome.storage.sync.get("blockedPatterns", (data) => {
  if (data.blockedPatterns) {
    blockedPatternsRaw = data.blockedPatterns;
    parsedBlockedPatterns = parseBlockedPatterns(blockedPatternsRaw);
    console.log("Initial parsedBlockedPatterns:", parsedBlockedPatterns);
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.blockedPatterns) {
    blockedPatternsRaw = changes.blockedPatterns.newValue;
    parsedBlockedPatterns = parseBlockedPatterns(blockedPatternsRaw);
    console.log("Updated parsedBlockedPatterns:", parsedBlockedPatterns);
  }
});

chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    const rule = parsedBlockedPatterns.find((rule) => {
      return rule.pattern.test(details.url);
    });

    // const embedPattern =
    //   /(?:youtube\.com\/embed\/|vimeo\.com\/video\/|dailymotion\.com\/embed\/video\/|platform\.twitter\.com\/widgets\/)/;
    // if (embedPattern.test(details.url)) {
    //   console.log("Embedded video, not redirecting:", details.url);
    //   return; // ignore embedded videos
    // }

    let frameId = details.frameId;

    if (frameId == 0 && rule) {
      console.log("Matched rule:", rule, "for url:", details.url);
      chrome.tabs.update(details.tabId, { url: rule.redirect });
    }

    chrome.tabs.query({}, (tabs) => {
      const maxTabs = 6;
      if (tabs.length > maxTabs) {
        chrome.tabs.remove(details.tabId);
        chrome.tabs.query(
          { active: true, currentWindow: true },
          (activeTabs) => {
            if (activeTabs[0]) {
              // Save the closed URL with timestamp to storage
              chrome.storage.local.get({ closedUrls: [] }, (data) => {
                const closedUrls = data.closedUrls;
                const existingIndex = closedUrls.findIndex(
                  (item) => item.url === details.url
                );
                const timestamp = Date.now();

                if (existingIndex !== -1) {
                  // Update timestamp if URL already exists
                  closedUrls[existingIndex].timestamp = timestamp;
                } else {
                  // Add new entry if URL does not exist
                  closedUrls.push({ url: details.url, timestamp });
                }

                chrome.storage.local.set({ closedUrls });
              });

              chrome.tabs.sendMessage(activeTabs[0].id, {
                text: `已超过 ${maxTabs} 个标签页。关闭的链接: ${details.url}`,
              });
            }
          }
        );
      }
    });
  },
  { url: [{ urlMatches: ".*" }] }
);

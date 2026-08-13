import { sendToPython } from "./utils.js";
let maxTabs = 10;
let enableRules = false; // Default value, can be changed in options

// Retrieve initially
chrome.storage.local.get("maxTabs", (data) => {
  if (data.maxTabs) {
    maxTabs = parseInt(data.maxTabs, 10);
  }
});

// initialize icon
chrome.storage.local.get("enableRules", (data) => {
  if (data.enableRules !== undefined) {
    enableRules = data.enableRules;
    updateIcon(enableRules);
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.maxTabs) {
    maxTabs = parseInt(changes.maxTabs.newValue, 10);
  }
  if (area === "local" && changes.enableRules) {
    enableRules = changes.enableRules.newValue;
    updateIcon(enableRules);
  }
});

let lastVisitedTabId = null;
let currentActiveTabId = null;

// 在插件启动时获取当前激活的标签页 ID
chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
  if (tabs && tabs.length > 0) {
    currentActiveTabId = tabs[0].id;
  }
});

// 监听标签页被激活（切换）的事件
chrome.tabs.onActivated.addListener(function (activeInfo) {
  const newlyActivatedTabId = activeInfo.tabId;

  // 在切换发生时，当前的 currentActiveTabId 就是切换前的 tab
  if (
    currentActiveTabId !== null &&
    currentActiveTabId !== newlyActivatedTabId
  ) {
    lastVisitedTabId = currentActiveTabId;
  }
  // 更新 currentActiveTabId 为新激活的 tab
  currentActiveTabId = newlyActivatedTabId;
});

// 可选：监听标签页关闭的事件，如果需要清除或处理相关 ID
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  if (tabId === lastVisitedTabId) {
    lastVisitedTabId = null;
  }
  if (tabId === currentActiveTabId) {
    currentActiveTabId = null;
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "startAutoEnableTimer") {
    sendToPython("disable");
    // 创建一个 5 分钟后的闹钟
    chrome.alarms.create("enableRulesAlarm", { delayInMinutes: 0.5 });
  } else if (message.action === "cancelTimer") {
    chrome.alarms.clear("enableRulesAlarm");
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "enableRulesAlarm") {
    chrome.storage.local.set({ enableRules: true });
  }
});

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
            copy: true,
          });
        },
      );
    });
  } else if (command === "enable_rule") {
    chrome.storage.local.set({ enableRules: true });
    updateIcon(true);
    chrome.action.openPopup();
  } else if (command === "toggle_last_tab") {
    // jump to lastVisitedTabId
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then((currentTabs) => {
        let currentTabId = null;
        if (currentTabs && currentTabs.length > 0) {
          currentTabId = currentTabs[0].id;
        }

        if (lastVisitedTabId) {
          chrome.tabs.update(lastVisitedTabId, { active: true });
        } else {
          // to first tab
          chrome.tabs.query({ currentWindow: true }).then((allTabs) => {
            if (allTabs.length > 0) {
              chrome.tabs.update(allTabs[0].id, { active: true });
            }
          });
        }
        lastVisitedTabId = currentTabId; // 更新 lastVisitedTabId
      })
      .catch((error) => {
        console.error("查询标签页时发生错误:", error);
      });
  }
});

let blockedPatternsRaw = "";
let parsedBlockedPatterns = [];
let currentTarget = "about:blank";

function parseBlockedPatterns(rawPatterns) {
  currentTarget = "about:blank"; // Reset currentTarget at the start of parsing
  return rawPatterns
    .split("\n")
    .map((pattern) => pattern.trim())
    .filter((pattern) => {
      if (pattern === "") {
        return false;
      } else if (pattern.startsWith("#")) {
        return false;
      }
      return true;
    })
    .map((pattern) => {
      const [patternStr, redirectUrl] = pattern
        .split("->")
        .map((str) => str.trim().replace(/^#\s*/, ""));
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

function checkAndRedirect(details) {
  // get checkbox value
  chrome.storage.local.get("enableRules", (data) => {
    enableRules = data.enableRules;
  });

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
    if (enableRules) {
      // sendToPython(details.url);
      chrome.tabs.update(details.tabId, { url: rule.redirect });
    }
    // chrome.tabs.update(details.tabId, { url: rule.redirect });
  }
}

chrome.storage.local.get("blockedPatterns", (data) => {
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

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  checkAndRedirect(details);
});

chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    checkAndRedirect(details);
    chrome.tabs.query({}, (tabs) => {
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
                  (item) => item.url === details.url,
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
          },
        );
      }
    });
  },
  { url: [{ urlMatches: ".*" }] },
);

function updateIcon(isEnabled) {
  const iconPath = isEnabled
    ? "icons/terminal_activate.png"
    : "icons/terminal_inactivate.png";

  chrome.action.setIcon({
    path: {
      16: iconPath,
    },
  });
}

// ==================== 从注释行解析跟踪模式并计数 ====================
const TRACK_WINDOW_MS = 2 * 60 * 60 * 1000; // 2小时
const MAX_TRACK_COUNT = 5;
const TRACK_STORAGE_KEY = "trackedVisitQueues";

/**
 * 从原始 blockedPatterns 文本中提取注释行（以 # 开头）作为跟踪模式
 * 每行格式：`# 正则表达式` 或 `# 正则表达式 -> 任意内容`（重定向部分忽略）
 * 返回数组：{ regex: RegExp, patternStr: string }[]
 */
function parseTrackedPatternsFromRaw(raw) {
  const patterns = [];
  if (!raw) return patterns;
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("#"))
    .forEach((line) => {
      // 去掉开头的 # 和可能的空格
      let cleaned = line.replace(/^#\s*/, "");
      // 如果包含 '->'，只取前面的部分
      if (cleaned.includes("->")) {
        cleaned = cleaned.split("->")[0].trim();
      }
      if (cleaned === "") return;
      try {
        const regex = new RegExp(cleaned);
        patterns.push({
          regex: regex,
          patternStr: cleaned, // 用作存储键
        });
      } catch (e) {
        console.warn("[跟踪] 无效正则表达式，已忽略:", cleaned, e);
      }
    });
  return patterns;
}

/**
 * 对每个匹配的 URL，更新该模式的访问队列（仅保留2小时内），并检查是否达到阈值
 */
function checkAndTrack(url) {
  const trackedPatterns = parseTrackedPatternsFromRaw(blockedPatternsRaw);
  if (trackedPatterns.length === 0) return;

  // 找到第一个匹配的模式
  let matched = null;
  for (const p of trackedPatterns) {
    if (p.regex.test(url)) {
      matched = p;
      break;
    }
  }
  if (!matched) return;

  const patternKey = matched.patternStr;
  const now = Date.now();

  chrome.storage.local.get(TRACK_STORAGE_KEY, (result) => {
    const allQueues = result[TRACK_STORAGE_KEY] || {};
    let queue = allQueues[patternKey] || [];

    // 过滤掉超过2小时的旧记录
    queue = queue.filter((t) => now - t <= TRACK_WINDOW_MS);
    // 加入当前访问时间
    queue.push(now);

    const count = queue.length;
    if (count >= MAX_TRACK_COUNT) {
      sendToPython(`[提醒] 模式 ${patternKey} 在 2 小时内访问达到 ${count} 次`);
    }

    // 保存队列（不清除，保留所有2小时内的记录）
    allQueues[patternKey] = queue;
    chrome.storage.local.set({ [TRACK_STORAGE_KEY]: allQueues });
  });
}

// 监听导航完成事件（仅主框架），用于跟踪计数
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameType === "outermost_frame") {
    checkAndTrack(details.url);
  }
});

import { isTimeInAllowedRange } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  // Function to check if the current time is between 12 PM and 1 PM

  const textarea = document.getElementById("blockedPatterns");

  // Initial setup and check
  chrome.storage.sync.get("blockedPatterns", (data) => {
    if (data.blockedPatterns) {
      textarea.value = data.blockedPatterns;
    }
  });

  // Disable textarea if not in the allowed time range
  if (!isTimeInAllowedRange()) {
    textarea.disabled = true;
    textarea.placeholder =
      "This field is only editable between 12 PM and 1 PM.";
  }

  // Event listener for input changes
  let timeout;
  textarea.addEventListener("input", () => {
    if (!isTimeInAllowedRange()) {
      return; // Do nothing if not in the allowed time range
    }

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      let patterns = textarea.value;
      textarea.value = patterns;
      chrome.storage.sync.set({ blockedPatterns: patterns });
    }, 1000); // 1 second delay
  });

  chrome.storage.sync.get("maxTabs", (data) => {
    if (data.maxTabs) {
      document.getElementById("maxTabsInput").value = data.maxTabs;
    }
  });

  document.getElementById("maxTabsInput").addEventListener("input", () => {
    const maxTabsValue = document.getElementById("maxTabsInput").value;
    chrome.storage.sync.set({ maxTabs: maxTabsValue });
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

  const closedTabsDiv = document.getElementById("closedTabs");

  // Function to format timestamp
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN"); // Specify Chinese locale
  }

  // Function to render closed URLs
  function renderClosedUrls(closedUrls) {
    closedTabsDiv.innerHTML = ""; // Clear existing list
    closedUrls.forEach((item, index) => {
      const urlElement = document.createElement("div");
      urlElement.className = "tabs";

      const link = document.createElement("a");
      link.href = item.url;
      link.textContent = item.url;
      link.target = "_blank";
      link.style.color = "#1a73e8";
      link.style.textDecoration = "none";

      const timestamp = document.createElement("span");
      timestamp.textContent = ` (${formatTimestamp(item.timestamp)})`;
      timestamp.style.marginLeft = "10px";
      timestamp.style.color = "#a0a0a0";
      timestamp.style.fontSize = "12px";

      const closeButton = document.createElement("button");
      closeButton.textContent = "x";
      closeButton.title = "Delete";
      closeButton.addEventListener("click", () => {
        deleteClosedUrl(index);
      });

      urlElement.appendChild(link);
      urlElement.appendChild(timestamp);
      urlElement.appendChild(closeButton);
      closedTabsDiv.appendChild(urlElement);
    });
  }

  // Function to delete a closed URL by index
  function deleteClosedUrl(index) {
    chrome.storage.local.get("closedUrls", (data) => {
      let closedUrls = data.closedUrls || [];
      closedUrls.splice(index, 1); // Remove the item at the specified index
      chrome.storage.local.set({ closedUrls }, () => {
        renderClosedUrls(closedUrls);
      });
    });
  }

  // Retrieve closed URLs from storage and render
  chrome.storage.local.get("closedUrls", (data) => {
    const closedUrls = data.closedUrls || [];
    renderClosedUrls(closedUrls);
  });

  // Listen for updates to closedUrls and re-render
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.closedUrls) {
      renderClosedUrls(changes.closedUrls.newValue);
    }
  });
});

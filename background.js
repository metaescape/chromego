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

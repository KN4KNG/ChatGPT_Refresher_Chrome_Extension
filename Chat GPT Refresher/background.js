let refreshCount = 0;
let refreshTimer = null;

function checkPage(tabId, tabUrl) {
  if (tabUrl.includes("https://www.chatgpt.com/login")) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
      func: () => document.body.innerText,
    },
    (result) => {
      const bodyText = result[0].result.toLowerCase();
      if (bodyText.includes("chatgpt is at capacity right now")) {
        refreshCount++;
        chrome.action.setBadgeText({ text: refreshCount.toString() });
        if (refreshCount === 1) {
          refreshTimer = setTimeout(refreshPage, 300000); // 5 minutes
        }
      } else {
        refreshCount = 0;
        chrome.action.setBadgeText({ text: "" });
        chrome.notifications.create(
          {
            type: "basic",
            iconUrl: "/images/icon.png",
            title: "ChatGPT Refresher",
            message: "ChatGPT is ready",
          },
          function () {}
        );
      }
    }
  );
}

function refreshPage(tabId) {
  chrome.tabs.reload(tabId);
  refreshTimer = setTimeout(refreshPage, 5000, tabId);
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete") {
    checkPage(tabId, tab.url);
  }
});

chrome.action.onClicked.addListener(function (tab) {
  const tabUrl = tab.url.toLowerCase();
  if (tabUrl.includes("https://www.chatgpt.com/login")) {
    return;
  }

  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
    refreshCount = 0;
    chrome.action.setBadgeText({ text: "" });
  } else {
    checkPage(tab.id, tabUrl);
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === "confirmRefresh") {
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: "/images/icon.png",
        title: "ChatGPT Refresher",
        message: "ChatGPT is still at capacity. Do you want to continue refreshing?",
        buttons: [
          { title: "Yes" },
          { title: "No" }
        ]
      },
      function (notificationId) {
        chrome.notifications.onButtonClicked.addListener(function (buttonNotificationId, buttonIndex) {
          if (buttonNotificationId === notificationId) {
            if (buttonIndex === 0) {
              refreshPage(sender.tab.id);
            }
            chrome.notifications.clear(notificationId);
          }
        });
      }
    );
  }
});

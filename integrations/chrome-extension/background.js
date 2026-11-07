// background.js — context menu: select text anywhere → "Check this contract".
// Nothing leaves the browser: the text is held in session storage (cleared when
// the browser closes) and scanned by the bundled engine on an extension page.

const MENU_ID = "fs-check-contract";

chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Check this contract with FreelanceShield",
    contexts: ["selection"],
  });
  if (details.reason === "install") {
    chrome.tabs.create({ url: "https://freelanceshield.me/dashboard?source=extension" });
  }
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;
  // selectionText is plain text; capped to keep storage and rendering bounded.
  await chrome.storage.session.set({ pendingText: info.selectionText.slice(0, 100000) });
  chrome.tabs.create({ url: chrome.runtime.getURL("results.html") });
});

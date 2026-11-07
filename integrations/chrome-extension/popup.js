/* global FSEngine, renderResult */
const $ = (id) => document.getElementById(id);
const MIN = 200;

async function scan() {
  const text = $("text").value.trim();
  $("err").textContent = "";
  if (text.length < MIN) {
    $("err").textContent = `Paste at least ${MIN} characters (you have ${text.length}).`;
    return;
  }
  const result = await FSEngine.analyzeContract(text);
  renderResult($("out"), result, { compact: true });
  $("full").hidden = false;
}

// Reads the user's selection, or the page text, from the active tab only —
// granted by the click itself (activeTab), so no host permissions are needed.
async function grab() {
  $("err").textContent = "";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("no tab");
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const sel = String(window.getSelection() || "").trim();
        return (sel || document.body?.innerText || "").slice(0, 100000);
      },
    });
    $("text").value = result || "";
    if (!result) $("err").textContent = "No text found on this page.";
  } catch {
    $("err").textContent = "This page can't be read (browser pages and the Web Store are blocked). Paste the text instead.";
  }
}

async function openFull() {
  await chrome.storage.session.set({ pendingText: $("text").value.slice(0, 100000) });
  chrome.tabs.create({ url: chrome.runtime.getURL("results.html") });
}

$("scan").addEventListener("click", scan);
$("grab").addEventListener("click", grab);
$("full").addEventListener("click", openFull);

/* global FSEngine, renderResult */
(async () => {
  const out = document.getElementById("out");
  const { pendingText } = await chrome.storage.session.get("pendingText");
  await chrome.storage.session.remove("pendingText");
  if (!pendingText || pendingText.trim().length < 50) {
    out.replaceChildren();
    const p = document.createElement("p");
    p.className = "note warn";
    p.textContent = "No contract text to check. Select text on a page, right-click, and choose “Check this contract with FreelanceShield”.";
    out.append(p);
    return;
  }
  renderResult(out, await FSEngine.analyzeContract(pendingText));
})();

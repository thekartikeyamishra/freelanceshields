/**
 * FreelanceShield for Google Docs — check the contract you are reading.
 *
 * Scope: documents.currentonly — the add-on can read ONLY the document it is
 * opened in, and only when the user runs it. The text is passed to the sidebar
 * and scanned there by the bundled engine. Nothing is sent to FreelanceShield
 * or any other server, and nothing is stored.
 */

function onOpen() {
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem("Check this contract", "showSidebar")
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showSidebar() {
  var html = HtmlService.createTemplateFromFile("Sidebar").evaluate().setTitle("FreelanceShield");
  DocumentApp.getUi().showSidebar(html);
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/** Selected text if there is a selection, otherwise the whole document body. */
function getContractText() {
  var doc = DocumentApp.getActiveDocument();
  var selection = doc.getSelection();
  var parts = [];
  if (selection) {
    selection.getRangeElements().forEach(function (r) {
      var el = r.getElement();
      if (el.editAsText) {
        var t = el.asText().getText();
        parts.push(r.isPartial() ? t.substring(r.getStartOffset(), r.getEndOffsetInclusive() + 1) : t);
      }
    });
  }
  var text = parts.join("\n").trim() || doc.getBody().getText();
  return { text: text.slice(0, 100000), fromSelection: parts.length > 0 };
}

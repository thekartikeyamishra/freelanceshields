# Google Docs add-on

**Extensions → FreelanceShield → Check this contract** opens a sidebar that scans the document (or the selection).
Scope `documents.currentonly`: it can read only the open document, only when run. No server calls.

## Install for yourself
1. `npm run build:integrations` (writes `Engine.html`, `Render.html`, `Styles.html`).
2. In a Google Doc: **Extensions → Apps Script**. Replace the files with `appsscript.json` (enable "Show manifest" in Project Settings), `Code.gs`, `Sidebar.html`, `Engine.html`, `Render.html`, `Styles.html`.
3. Reload the doc. The menu appears under Extensions.

Or with clasp: `npm i -g @google/clasp && clasp login && clasp create --type standalone --rootDir integrations/google-docs-addon && clasp push`.

## Publish (Workspace Marketplace, free)
1. Create a Google Cloud project, link it to the script, and configure the OAuth consent screen with the two scopes above.
2. Deploy as an Editor add-on, then enable the **Google Workspace Marketplace SDK** and fill in the listing: privacy policy `https://freelanceshield.me/legal/privacy`, terms `https://freelanceshield.me/legal/terms`.
3. The `currentonly` scope is non-sensitive, so no security assessment is needed.

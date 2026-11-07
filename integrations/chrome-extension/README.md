# Chrome / Edge extension

Select contract text on any page → right-click → **Check this contract with FreelanceShield**.
Or open the popup and grab the page's text. The scan runs inside the extension; nothing is uploaded.

Permissions: `contextMenus`, `activeTab` (reads only the tab you click on, only when you click),
`scripting`, `storage` (session only). **No host permissions**, so Web Store review is the fast path.

## Test locally
1. `npm run build:integrations` (creates `engine.js`)
2. Open `chrome://extensions`, turn on Developer mode, then **Load unpacked** and pick this folder.

## Publish
1. Zip the folder contents (PowerShell: `Compress-Archive -Path integrations\chrome-extension\* -DestinationPath fs-extension.zip -Force`).
2. Chrome Web Store developer account ($5 one-time), upload the zip.
3. Privacy tab: "Does not collect or use user data". Single purpose: "Check contract text for clause types and missing freelancer protections."
4. Edge Add-ons accepts the same zip for free.

Bump `version` in `manifest.json` for every upload.

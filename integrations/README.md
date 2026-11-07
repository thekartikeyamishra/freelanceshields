# FreelanceShield integrations

One engine (`lib/`), six surfaces. Every surface either runs the engine
locally (no server cost) or calls the stateless `/api/mcp` and `/api/v1` routes
(a few ms of CPU, nothing stored).

| Surface | Folder | Where users find it | Cost to you | Runs |
|---|---|---|---|---|
| Installable app (Android, iOS, Windows, macOS, ChromeOS) | the website itself | "Install" in the browser; Play Store via TWA | $0 (Play: $25 once) | on device |
| Chrome / Edge extension | `chrome-extension/` | Chrome Web Store, Edge Add-ons | $5 once | on device |
| Google Docs add-on | `google-docs-addon/` | Google Workspace Marketplace | $0 | in the Docs sidebar |
| ChatGPT app + Custom GPT | `chatgpt/` | ChatGPT apps directory, GPT Store | $0 | `/api/mcp`, `/openapi.json` |
| Claude connector + skill | `claude/` | Claude connectors directory | $0 | `/api/mcp` |
| Gemini CLI extension | `gemini-extension/` | Gemini extensions gallery | $0 | `/api/mcp` |
| Any agent | — | `/llms.txt`, `/openapi.json` | $0 | `/api/v1/*` |

Build the bundled engine before packaging the extension or the Docs add-on:

```
npm install
npm run build:integrations
```

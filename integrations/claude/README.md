# Claude

## Connector (claude.ai, Claude Desktop, Claude mobile)
Settings → Connectors → **Add custom connector** → URL `https://freelanceshield.me/api/mcp`. No auth.
Then submit it to Anthropic's connectors directory (requires the privacy policy URL and a contact email; tool annotations are set).

## Claude Code / any MCP client
```
claude mcp add --transport http freelanceshield https://freelanceshield.me/api/mcp
```

## Skill
`freelanceshield-skill/SKILL.md` teaches Claude *when* to use the tools (invoice → link, late payment → reminder, contract → scan).
Upload it under Settings → Capabilities → Skills, or ship it alongside the connector.

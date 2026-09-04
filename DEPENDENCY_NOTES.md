# package.json changes

## Removed

| Package | Reason |
|---|---|
| `html2canvas` | The PDF generator no longer screenshots the DOM. It draws vector text with jsPDF. |
| `framer-motion` (^12.0.0) | Only used by the old `FAQSection` accordion, which is now `<details>`. This was ~110 KB gzipped of JavaScript for an open/close animation. Check `grep -rn "framer-motion"` before removing in case it is used somewhere I have not seen. |
| `canvas-confetti` + `@types/canvas-confetti` | Not imported anywhere in the files provided. |
| `react-hook-form` | Not imported anywhere in the files provided. The invoice form uses controlled inputs via `useInvoice`. |
| `clsx` | Not imported anywhere in the files provided. |
| `tailwind-merge` | Not imported anywhere in the files provided. |

Run `grep -rn "canvas-confetti\|react-hook-form\|clsx\|tailwind-merge\|framer-motion" app components lib`
before deleting, in case one of them is used in a file you have not sent me.

## Upgraded

**`lucide-react` `^0.300.0` → `^0.469.0`.**

This is the reason `vercel.json` needs `--legacy-peer-deps`. lucide-react 0.300.0
declares a peer dependency on React 16–18. Your project is on React 19, so npm
refuses to install without the flag, and `--legacy-peer-deps` suppresses the
error rather than resolving it. Every future dependency conflict is also silenced
by that flag, including real ones.

0.469.0 supports React 19 properly. After upgrading you should be able to delete
`vercel.json` entirely — see below.

Note that later lucide versions removed the `Twitter` and `Linkedin` brand
exports. The rewritten `/about` page does not import them, so this upgrade will
not break it.

## vercel.json

```json
{ "installCommand": "npm install --legacy-peer-deps" }
```

Try deleting this file after the lucide upgrade. Run `npm install` locally with
no flags first; if it succeeds, the file is no longer needed. Keeping
`--legacy-peer-deps` permanently means you will not be told about the next
genuine incompatibility.

## tailwind.config.ts — delete it

It has never been loaded. See HANDOVER.md section 1.

## global.d.ts — delete it

`declare module "*.css";` is not needed. Next.js ships CSS module and global
stylesheet types in `next-env.d.ts`. A blanket `declare module` for CSS suppresses
type errors rather than adding types.

## remark-gfm was installed but never used

`remark-gfm` is in your dependencies but `<ReactMarkdown>` in
`app/resources/[slug]/page.tsx` was called without it. That means GitHub-flavoured
markdown was not being parsed in any article: **tables did not render, nor did
strikethrough, task lists, or autolinks.** On tax guides comparing thresholds
across countries, a markdown table would have come out as raw pipe characters.
The rewritten article page passes the plugin.

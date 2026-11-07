// lib/ads.ts — every ad placement on the site, in one place.
//
// A placement renders only when BOTH NEXT_PUBLIC_ADSENSE_CLIENT_ID and its slot
// env var are set, so ads can be switched on or off per placement from Vercel
// without a code change.
//
// Placement rules (reviewed against AdSense placement policy):
//   - never inside a tool, or between an input and its action
//   - never above the H1 or first paragraph
//   - never adjacent to buttons or navigation
//   - at most ONE ad per tool page, ONE per article, ONE per index page
//   - only after real content the visitor came for
// Do NOT add a placement that breaks these rules to chase revenue. Policy
// strikes cost far more than the extra impressions earn.

export type AdPlacementName = "articleEnd" | "toolFooter" | "resourcesIndex";

const SLOTS: Record<AdPlacementName, string | undefined> = {
  articleEnd: process.env.NEXT_PUBLIC_AD_SLOT_ARTICLE_END,
  toolFooter: process.env.NEXT_PUBLIC_AD_SLOT_TOOL_FOOTER,
  resourcesIndex: process.env.NEXT_PUBLIC_AD_SLOT_RESOURCES_INDEX,
};

export function adSlotFor(name: AdPlacementName): string | null {
  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) return null;
  const slot = SLOTS[name];
  return slot && /^\d{6,}$/.test(slot) ? slot : null;
}

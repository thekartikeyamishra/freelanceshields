// lib/assist/knowledge.ts
// The reviewed answer set Shieldy answers from. Runs entirely in the browser:
// no model, no server, no cost per question. To improve Shieldy, add answers
// for the questions people actually email you about.

export type Lang = "en" | "hi";

export interface Answer {
  id: string;
  keys: string[];
  en: string;
  hi: string;
  href?: string;
  cta?: { en: string; hi: string };
}

export const KB: Answer[] = [
  {
    id: "invoice",
    keys: ["invoice", "bill", "बिल", "इनवॉइस", "pdf", "gst", "vat", "receipt"],
    en: "The invoice generator makes a real-text PDF with tax, discounts and reverse charge. Tax is charged on the discounted amount.",
    hi: "इनवॉइस जनरेटर टैक्स, डिस्काउंट और रिवर्स चार्ज के साथ असली-टेक्स्ट PDF बनाता है। टैक्स डिस्काउंट के बाद की रकम पर लगता है।",
    href: "/invoice-maker", cta: { en: "Make an invoice", hi: "इनवॉइस बनाएँ" },
  },
  {
    id: "contract",
    keys: ["contract", "clause", "nda", "indemn", "non-compete", "agreement", "कॉन्ट्रैक्ट", "अनुबंध"],
    en: "Paste a contract into the scanner to see which of twelve clause types it contains and which protections are missing. It matches patterns — it isn't a lawyer.",
    hi: "स्कैनर में कॉन्ट्रैक्ट पेस्ट करें — यह 12 तरह के क्लॉज़ और गायब सुरक्षा दिखाता है। यह पैटर्न मिलाता है, वकील नहीं है।",
    href: "/contract-scanner", cta: { en: "Scan a contract", hi: "कॉन्ट्रैक्ट जाँचें" },
  },
  {
    id: "project",
    keys: ["project", "scope", "milestone", "deposit", "plan", "प्रोजेक्ट", "माइलस्टोन", "स्कोप"],
    en: "The project planner turns an agreement into scope, paid milestones and terms, flags the gaps, and exports a fingerprinted PDF.",
    hi: "प्रोजेक्ट प्लानर स्कोप, माइलस्टोन और शर्तें तय करता है, कमियाँ बताता है, और PDF बनाता है।",
    href: "/project-planner", cta: { en: "Plan a project", hi: "प्लान बनाएँ" },
  },
  {
    id: "late",
    keys: ["late", "unpaid", "not paid", "ghost", "overdue", "chase", "पैसा", "भुगतान", "देर"],
    en: "If a client is late: resend the invoice with the due date, then a firm reminder citing your late-fee term, then pause further work. Milestones limit how much is ever at risk.",
    hi: "क्लाइंट देर करे तो: ड्यू डेट के साथ इनवॉइस दोबारा भेजें, फिर लेट-फी शर्त के साथ रिमाइंडर, फिर आगे का काम रोकें।",
    href: "/project-planner", cta: { en: "Set up milestones", hi: "माइलस्टोन सेट करें" },
  },
  {
    id: "rate",
    keys: ["rate", "price", "charge", "hourly", "how much", "कितना", "रेट"],
    en: "A sustainable rate covers your target income, expenses and tax across only the hours you can actually bill — usually 50–70% of working hours, not all of them.",
    hi: "सही रेट आपकी आय, खर्च और टैक्स को सिर्फ़ बिल होने वाले घंटों में बाँटकर निकलता है — आमतौर पर कुल घंटों का 50–70%।",
  },
  {
    id: "privacy",
    keys: ["privacy", "data", "upload", "safe", "secure", "डेटा", "सुरक्षित"],
    en: "Nothing you type in the tools is uploaded. Drafts are saved on this device, unencrypted, and you can erase them any time.",
    hi: "टूल में जो लिखते हैं वह अपलोड नहीं होता। ड्राफ़्ट इसी डिवाइस पर सेव रहते हैं और आप कभी भी मिटा सकते हैं।",
    href: "/legal/privacy", cta: { en: "Privacy details", hi: "प्राइवेसी विवरण" },
  },
  {
    id: "free",
    keys: ["free", "cost", "pay", "price of", "subscription", "फ्री", "मुफ़्त"],
    en: "Every tool is free, with no account and no watermark. The site is funded by clearly labelled ads.",
    hi: "सभी टूल मुफ़्त हैं — कोई अकाउंट या वॉटरमार्क नहीं। साइट विज्ञापनों से चलती है।",
  },
  {
    id: "who",
    keys: ["who are you", "chatgpt", "bot", "are you ai", "तुम कौन", "आप कौन"],
    en: "I'm Shieldy, the site's guide. My answers are written and checked in advance, so I don't make things up.",
    hi: "मैं शील्डी हूँ, साइट का गाइड। मेरे जवाब पहले से लिखे और जाँचे गए हैं।",
  },
  {
    id: "contact",
    keys: ["contact", "help", "support", "email", "human", "मदद", "संपर्क"],
    en: "For anything I can't answer, email workmailkartikeya@gmail.com — a person reads every message.",
    hi: "जो मैं न बता सकूँ, उसके लिए workmailkartikeya@gmail.com पर ईमेल करें — हर संदेश कोई इंसान पढ़ता है।",
    href: "/contact", cta: { en: "Contact page", hi: "संपर्क पेज" },
  },
];

export const FALLBACK = {
  en: "I don't have a checked answer for that. Try the tools below, or email workmailkartikeya@gmail.com.",
  hi: "इसका जाँचा हुआ जवाब मेरे पास नहीं है। नीचे के टूल आज़माएँ या workmailkartikeya@gmail.com पर लिखें।",
};

/** Normalises input: lowercase, collapse whitespace, cap length. */
export function normalise(q: string): string {
  return String(q ?? "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 300);
}

/** Best keyword match, weighted by key length. null when nothing matches. */
export function matchAnswer(q: string): Answer | null {
  const t = normalise(q);
  if (!t) return null;
  let best: Answer | null = null;
  let bestScore = 0;
  for (const a of KB) {
    const score = a.keys.reduce((n, k) => (t.includes(k) ? n + k.length : n), 0);
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}

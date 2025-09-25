/**
 * Shared code between client and server
 * Types and small pure functions usable on both sides
 */

// Demo type kept for compatibility with existing example
export interface DemoResponse {
  message: string;
}

// CivicBot core types
export type ComplaintCategory =
  | "garbage"
  | "streetlight"
  | "water_leak"
  | "road_damage"
  | "drainage"
  | "other";

export interface ClassifyRequest {
  text: string;
}

export interface ClassifyResponse {
  category: ComplaintCategory;
  confidence: number; // 0..1
  language: DetectedLanguage;
}

export type DetectedLanguage = "en" | "hi" | "ta" | "unknown";

export interface CreateComplaintRequest {
  text: string;
  language?: DetectedLanguage;
}

export interface CreateComplaintResponse {
  ticketId: string;
  category: ComplaintCategory;
  language: DetectedLanguage;
  createdAt: string; // ISO
}

// Lightweight multilingual keyword-based classifier (fallback for MVP)
// Designed to be replaced by a fine-tuned XLM-RoBERTa model later
const KEYWORDS: Record<ComplaintCategory, string[]> = {
  garbage: [
    // English
    "garbage",
    "trash",
    "waste",
    "litter",
    "dustbin",
    // Hindi (latin + Devanagari transliterations)
    "kachra",
    "kuda",
    "कचरा",
    // Tamil
    "kuppai",
    "குப்பை",
  ],
  streetlight: [
    "streetlight",
    "street light",
    "light pole",
    "lamp",
    "bulb",
    "dark street",
    // Hindi
    "street light kharab",
    "बत्ती",
    // Tamil
    "veethi vilakku",
    "வீதிவிளக்கு",
  ],
  water_leak: [
    "water leak",
    "leak",
    "pipe burst",
    "pipeline",
    // Hindi
    "paani leak",
    "पानी",
    // Tamil
    "thanni",
    "தண்ணீர்",
  ],
  road_damage: [
    "pothole",
    "road damage",
    "broken road",
    "roads",
    // Hindi
    "gadda",
    "सड़क",
    // Tamil
    "saalai",
    "சாலை",
  ],
  drainage: [
    "sewage",
    "drain",
    "drainage",
    "clogged",
    // Hindi
    "naali",
    "नाली",
    // Tamil
    "kuzhai",
    "க்குழாய்",
  ],
  other: [],
};

export function detectLanguage(text: string): DetectedLanguage {
  // Simple script-based detection for MVP
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    // Devanagari block
    if (code >= 0x0900 && code <= 0x097f) return "hi";
    // Tamil block
    if (code >= 0x0b80 && code <= 0x0bff) return "ta";
  }
  // Heuristic latin spellings
  const t = text.toLowerCase();
  if (/(kachra|kuda|paani|gadda|naali)/.test(t)) return "hi";
  if (/(kuppai|thanni|saalai|vilakku)/.test(t)) return "ta";
  if (/[a-z]/.test(t)) return "en";
  return "unknown";
}

export function classifyComplaint(text: string): { category: ComplaintCategory; scoreMap: Record<ComplaintCategory, number> } {
  const t = text.toLowerCase();
  const scores: Record<ComplaintCategory, number> = {
    garbage: 0,
    streetlight: 0,
    water_leak: 0,
    road_damage: 0,
    drainage: 0,
    other: 0,
  };

  for (const [cat, words] of Object.entries(KEYWORDS) as [ComplaintCategory, string[]][]) {
    for (const w of words) {
      if (!w) continue;
      const occurrences = t.split(w.toLowerCase()).length - 1;
      if (occurrences > 0) scores[cat] += occurrences;
    }
  }

  // Soft boosts for co-occurring hints
  if (/smell|stink|dirty/.test(t)) scores.garbage += 0.5;
  if (/dark|night/.test(t)) scores.streetlight += 0.3;
  if (/water|pipe|leak/.test(t)) scores.water_leak += 0.3;
  if (/road|pothole|traffic/.test(t)) scores.road_damage += 0.3;
  if (/drain|sewage|overflow/.test(t)) scores.drainage += 0.3;

  // Choose best category or other
  const [bestCat, bestScore] = (Object.entries(scores) as [ComplaintCategory, number][]) 
    .sort((a, b) => b[1] - a[1])[0];

  if (bestScore <= 0) {
    scores.other = 1;
    return { category: "other", scoreMap: scores };
  }
  return { category: bestCat, scoreMap: scores };
}

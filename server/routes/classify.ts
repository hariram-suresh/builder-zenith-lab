import { RequestHandler } from "express";
import { ClassifyRequest, ClassifyResponse, classifyComplaint, detectLanguage, ComplaintCategory } from "../../shared/api";

async function classifyWithHuggingFace(text: string): Promise<{ label: string; score: number }[] | null> {
  const token = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HF_MODEL_ID;
  if (!token || !model) return null;
  try {
    const resp = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: text }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const arr = Array.isArray(data) ? data : data?.[0];
    if (!Array.isArray(arr)) return null;
    return arr.map((x: any) => ({ label: String(x.label), score: Number(x.score) }));
  } catch {
    return null;
  }
}

function mapLabelToCategory(label: string): ComplaintCategory {
  const l = label.toLowerCase();
  const mappingEnv = process.env.HF_LABELS ? (JSON.parse(process.env.HF_LABELS) as Record<string, ComplaintCategory>) : {};
  if (mappingEnv[l]) return mappingEnv[l];
  if (/(garbage|trash|waste|litter)/.test(l)) return "garbage";
  if (/(street.?light|lamp|bulb)/.test(l)) return "streetlight";
  if (/(water|leak|pipe|pipeline)/.test(l)) return "water_leak";
  if (/(road|pothole|asphalt)/.test(l)) return "road_damage";
  if (/(drain|sewage|sewer)/.test(l)) return "drainage";
  return "other";
}

export const handleClassify: RequestHandler = async (req, res) => {
  try {
    const { text } = (req.body || {}) as ClassifyRequest;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Invalid 'text'" });
    }

    const lang = detectLanguage(text);

    // Try HF XLM-R model first if configured
    const hf = await classifyWithHuggingFace(text);
    if (hf && hf.length) {
      const best = hf.sort((a, b) => b.score - a.score)[0];
      const category = mapLabelToCategory(best.label);
      const response: ClassifyResponse = {
        category,
        confidence: Math.max(0, Math.min(1, best.score)),
        language: lang,
      };
      return res.status(200).json(response);
    }

    // Fallback to local keyword classifier
    const { category, scoreMap } = classifyComplaint(text);
    const total = Object.values(scoreMap).reduce((a, b) => a + b, 0) || 1;
    const topScore = scoreMap[category] || 0;
    const confidence = Math.max(0, Math.min(1, topScore / total));

    const response: ClassifyResponse = { category, confidence, language: lang };
    res.status(200).json(response);
  } catch (e) {
    res.status(500).json({ error: "Classification failed" });
  }
};

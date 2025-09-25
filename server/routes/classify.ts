import { RequestHandler } from "express";
import { ClassifyRequest, ClassifyResponse, classifyComplaint, detectLanguage } from "@shared/api";

export const handleClassify: RequestHandler = async (req, res) => {
  try {
    const { text } = (req.body || {}) as ClassifyRequest;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Invalid 'text'" });
    }

    const lang = detectLanguage(text);
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

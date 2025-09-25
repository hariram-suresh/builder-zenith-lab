import { RequestHandler } from "express";
import fs from "fs";
import path from "path";
import {
  CreateComplaintRequest,
  CreateComplaintResponse,
  classifyComplaint,
  detectLanguage,
} from "@shared/api";

const DATA_DIR = path.resolve("server", "data");
const CSV_PATH = path.join(DATA_DIR, "complaints.csv");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function ensureCsvHeader() {
  ensureDataDir();
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(
      CSV_PATH,
      [
        "ticketId",
        "createdAt",
        "language",
        "category",
        "status",
        "text",
      ].join(",") + "\n",
      "utf8",
    );
  }
}

function generateTicketId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CIV-${ts}-${rnd}`;
}

export const handleCreateComplaint: RequestHandler = async (req, res) => {
  try {
    const { text, language } = (req.body || {}) as CreateComplaintRequest;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Invalid 'text'" });
    }

    const lang = language ?? detectLanguage(text);
    const { category } = classifyComplaint(text);
    const ticketId = generateTicketId();
    const createdAt = new Date().toISOString();

    ensureCsvHeader();
    const row = [
      ticketId,
      createdAt,
      lang,
      category,
      "new",
      JSON.stringify(text).slice(1, -1), // escape commas/newlines via JSON string
    ].join(",") + "\n";

    fs.appendFileSync(CSV_PATH, row, "utf8");

    const response: CreateComplaintResponse = {
      ticketId,
      category,
      language: lang,
      createdAt,
    };
    res.status(201).json(response);
  } catch (e) {
    res.status(500).json({ error: "Failed to create complaint" });
  }
};

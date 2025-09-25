import { RequestHandler } from "express";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import {
  CreateComplaintRequest,
  CreateComplaintResponse,
  classifyComplaint,
  detectLanguage,
} from "../../shared/api";

const DATA_DIR = path.resolve("server", "data");
const CSV_PATH = path.join(DATA_DIR, "complaints.csv");

const DATABASE_URL = process.env.DATABASE_URL;
let pool: Pool | null = null;
async function ensureTable() {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS complaints (
    id serial primary key,
    ticket_id text unique not null,
    created_at timestamptz not null,
    language text not null,
    category text not null,
    status text not null,
    text text not null
  )`);
}
if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  ensureTable().catch(() => void 0);
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function ensureCsvHeader() {
  ensureDataDir();
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(
      CSV_PATH,
      ["ticketId", "createdAt", "language", "category", "status", "text"].join(
        ",",
      ) + "\n",
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

    if (pool) {
      await ensureTable();
      await pool.query(
        `INSERT INTO complaints (ticket_id, created_at, language, category, status, text)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (ticket_id) DO NOTHING`,
        [ticketId, createdAt, lang, category, "new", text],
      );
    } else {
      ensureCsvHeader();
      const row =
        [
          ticketId,
          createdAt,
          lang,
          category,
          "new",
          JSON.stringify(text).slice(1, -1),
        ].join(",") + "\n";
      fs.appendFileSync(CSV_PATH, row, "utf8");
    }

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

import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleClassify } from "./routes/classify";
import { handleCreateComplaint } from "./routes/complaints";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health + sample
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app.get("/api/demo", handleDemo);

  // CivicBot APIs
  app.post("/api/classify", handleClassify);
  app.post("/api/complaints", handleCreateComplaint);

  return app;
}

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
import express from "express";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Groq
  const apiKey = process.env.GROQ_API_KEY || "";
  const groq = new Groq({ apiKey });

  // Proxy API routes to FastAPI backend
  app.all("/api/*", async (req, res) => {
    try {
      // Forward to FastAPI running on port 8000
      const targetUrl = `http://127.0.0.1:8000${req.originalUrl}`;
      console.log(`Proxying ${req.method} ${req.originalUrl} -> ${targetUrl}`);
      
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        headers: { 
          "Content-Type": "application/json"
        }
      });
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error("Proxy Error:", error.message);
      if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(503).json({ error: "Backend system (FastAPI) is not running on port 8000." });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

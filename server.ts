import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy route to bypass CORS for the high-performance video scrubbing
  app.get("/api/video", async (req, res) => {
    const videoUrl = "https://www.image2url.com/r2/default/videos/1782479002426-81d17bc5-d96b-4f39-aac4-2511994264ab.mp4";
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) {
        res.status(response.status).send("Failed to fetch video from remote source.");
        return;
      }

      const buffer = await response.arrayBuffer();
      
      // Set headers to support caching and prevent any CORS blocking
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error("Error proxying video:", err);
      res.status(500).send("Error proxying video file.");
    }
  });

  // Vite middleware for development or serving production build
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

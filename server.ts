import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy route to bypass CORS and support HTTP range requests for iOS Safari
  let videoCache: Buffer | null = null;
  const videoUrl = "https://video.zig.ht/api/videos/file/1782828823690-293268447.mp4";

  app.get("/api/test-video", async (req, res) => {
    try {
      console.log("Testing fetch for:", videoUrl);
      const response = await fetch(videoUrl);
      const headersObj: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        headersObj[key] = val;
      });
      res.json({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: headersObj,
        url: response.url
      });
    } catch (err: any) {
      console.error("Fetch test failed:", err);
      res.json({
        error: err.message || String(err),
        stack: err.stack
      });
    }
  });

  app.get("/api/video", async (req, res) => {
    try {
      if (!videoCache) {
        const response = await fetch(videoUrl);
        if (!response.ok) {
          res.status(response.status).send("Failed to fetch video from remote source.");
          return;
        }
        const arrayBuffer = await response.arrayBuffer();
        videoCache = Buffer.from(arrayBuffer);
      }

      const totalLength = videoCache.length;
      const range = req.headers.range;

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Accept-Ranges", "bytes");

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

        if (start >= totalLength || end >= totalLength) {
          res.writeHead(416, { "Content-Range": `bytes */${totalLength}` });
          return res.end();
        }

        const chunksize = (end - start) + 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${totalLength}`,
          "Content-Length": chunksize,
          "Content-Type": "video/mp4",
        });
        res.end(videoCache.subarray(start, end + 1));
      } else {
        res.writeHead(200, {
          "Content-Length": totalLength,
          "Content-Type": "video/mp4",
        });
        res.end(videoCache);
      }
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

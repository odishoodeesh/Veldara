import React, { useEffect, useRef, useState } from "react";

const REMOTE_VIDEO_URL =
  "https://www.image2url.com/r2/default/videos/1782479002426-81d17bc5-d96b-4f39-aac4-2511994264ab.mp4";
const LOCAL_PROXY_URL = "/api/video";

export default function ScrollVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoFallbackRef = useRef<HTMLVideoElement>(null);

  const [isPreloaded, setIsPreloaded] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState(LOCAL_PROXY_URL);

  // References to keep render loop in sync without re-triggering effects
  const framesRef = useRef<ImageBitmap[]>([]);
  const framesReadyRef = useRef<boolean>(false);
  const videoSeekingRef = useRef<boolean>(false);
  const lastFrameIdxRef = useRef<number>(-1);
  const lerpedProgressRef = useRef<number>(0);

  // Get current scroll progress based on triggers
  const getScrollProgress = (): number => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Video starts scrubbing at scrollY = vh * 0.5 and ends at bottom of page
    const start = vh * 0.5;
    const end = documentHeight - vh;
    const range = end - start;
    
    if (range <= 0) return 0;
    return Math.max(0, Math.min(1, (scrollY - start) / range));
  };

  // Resize canvas to match the physical container size
  const resizeCanvas = (canvas: HTMLCanvasElement, width: number, height: number) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.round(width * dpr);
    const targetHeight = Math.round(height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
  };

  // Draw an ImageBitmap to the canvas, simulating object-fit: cover
  const drawFrame = (canvas: HTMLCanvasElement, frame: ImageBitmap) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    
    const scale = Math.max(cw / frame.width, ch / frame.height);
    const dw = frame.width * scale;
    const dh = frame.height * scale;
    
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(frame, dx, dy, dw, dh);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Use ResizeObserver to adapt canvas dimensions instantly on viewport shifts
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        resizeCanvas(canvas, width, height);
        
        // Redraw current frame immediately on resize
        const currentProgress = lerpedProgressRef.current;
        const frames = framesRef.current;
        if (framesReadyRef.current && frames.length > 0) {
          const idx = Math.round(currentProgress * (frames.length - 1));
          const currentFrame = frames[idx];
          if (currentFrame) {
            drawFrame(canvas, currentFrame);
          }
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Frame extraction effect with robust same-origin caching and external fallbacks
  useEffect(() => {
    let active = true;
    let objectUrl = "";

    async function extractFrames() {
      let currentUrl = LOCAL_PROXY_URL;
      try {
        let response: Response;
        try {
          response = await fetch(currentUrl);
          if (!response.ok) {
            throw new Error("Local video proxy endpoint returned non-OK status.");
          }
        } catch (proxyErr) {
          console.warn(
            "Local video proxy is not available (common on static platforms like Cloudflare Pages). Falling back to direct remote URL.",
            proxyErr
          );
          currentUrl = REMOTE_VIDEO_URL;
          setResolvedVideoUrl(REMOTE_VIDEO_URL);
          // Try fetching directly from the remote URL with CORS
          response = await fetch(currentUrl, { mode: "cors" });
          if (!response.ok) {
            throw new Error("Direct fetch of remote video URL failed.");
          }
        }

        const blob = await response.blob();
        if (!active) return;

        objectUrl = URL.createObjectURL(blob);
        const tempVideo = document.createElement("video");
        tempVideo.muted = true;
        tempVideo.playsInline = true;
        tempVideo.crossOrigin = "anonymous";
        tempVideo.preload = "auto";
        tempVideo.src = objectUrl;

        await new Promise<void>((resolve, reject) => {
          tempVideo.onloadedmetadata = () => resolve();
          tempVideo.onerror = () => reject(new Error("Video load metadata failed"));
          setTimeout(() => reject(new Error("Video load timeout")), 15000);
        });

        if (!active) return;

        // Scaling video frames slightly to preserve pristine quality while saving memory
        const maxDimension = 1280;
        const scale = Math.min(1, maxDimension / tempVideo.videoWidth);
        const scaledWidth = Math.round(tempVideo.videoWidth * scale);
        const scaledHeight = Math.round(tempVideo.videoHeight * scale);
        
        // Sample 30 frames per second of video duration (balanced frame count for extreme smoothness and fast pre-rendering)
        const frameCount = Math.max(60, Math.min(150, Math.round(tempVideo.duration * 30)));
        const extracted: ImageBitmap[] = [];

        for (let i = 0; i < frameCount; i++) {
          if (!active) return;
          const time = (i / (frameCount - 1)) * (tempVideo.duration - 0.05);
          tempVideo.currentTime = time;

          await new Promise<void>((resolve) => {
            const onSeeked = () => {
              tempVideo.removeEventListener("seeked", onSeeked);
              resolve();
            };
            tempVideo.addEventListener("seeked", onSeeked);
            setTimeout(() => {
              tempVideo.removeEventListener("seeked", onSeeked);
              resolve(); // resolve anyway to avoid hanging indefinitely if seek stalls
            }, 800);
          });

          try {
            const bitmap = await createImageBitmap(tempVideo, {
              resizeWidth: scaledWidth,
              resizeHeight: scaledHeight,
            });
            extracted.push(bitmap);
          } catch (bitmapErr) {
            console.warn("Failed to create image bitmap for frame", i, bitmapErr);
          }
          
          setPreloadProgress(Math.round(((i + 1) / frameCount) * 100));
        }

        if (active && extracted.length > 0) {
          framesRef.current = extracted;
          framesReadyRef.current = true;
          setIsPreloaded(true);
        }
      } catch (err) {
        console.warn(
          "High-performance scroll-video pre-rendering failed. Falling back to native scrolling using direct remote URL.",
          err
        );
        if (active) {
          setResolvedVideoUrl(REMOTE_VIDEO_URL);
          setIsPreloaded(false);
        }
      }
    }

    extractFrames();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      // Clean up extracted bitmaps
      framesRef.current.forEach((bitmap) => bitmap.close());
    };
  }, []);

  // Frame tick animation loop with silky-smooth progress interpolation (lerping)
  useEffect(() => {
    const canvas = canvasRef.current;
    const videoFallback = videoFallbackRef.current;
    let animId: number;
    let seekTimeout: number;

    const tick = () => {
      const targetProgress = getScrollProgress();
      
      // Interpolate progress smoothly with a beautiful exponential decay
      const currentProgress = lerpedProgressRef.current;
      const diff = targetProgress - currentProgress;
      
      if (Math.abs(diff) < 0.0001) {
        lerpedProgressRef.current = targetProgress;
      } else {
        // Easing factor: 0.07 offers perfect responsiveness and silky momentum
        lerpedProgressRef.current += diff * 0.07;
      }

      const progress = lerpedProgressRef.current;

      if (framesReadyRef.current && framesRef.current.length > 0 && canvas) {
        const idx = Math.round(progress * (framesRef.current.length - 1));
        if (idx !== lastFrameIdxRef.current) {
          lastFrameIdxRef.current = idx;
          const frame = framesRef.current[idx];
          if (frame) {
            drawFrame(canvas, frame);
          }
        }
      } else if (
        videoFallback &&
        videoFallback.duration &&
        isFinite(videoFallback.duration) &&
        videoFallback.readyState >= 1
      ) {
        // Native fallback seeking with simple frame locking and safety timeout reset
        const targetTime = progress * videoFallback.duration;
        if (!videoSeekingRef.current && Math.abs(videoFallback.currentTime - targetTime) > 0.01) {
          videoSeekingRef.current = true;
          videoFallback.currentTime = targetTime;
          
          window.clearTimeout(seekTimeout);
          seekTimeout = window.setTimeout(() => {
            videoSeekingRef.current = false;
          }, 250); // safety valve to prevent permanent seek-lock hang
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    const handleSeeked = () => {
      videoSeekingRef.current = false;
    };

    if (videoFallback) {
      videoFallback.addEventListener("seeked", handleSeeked);
      videoFallback.addEventListener("stalled", handleSeeked);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.clearTimeout(seekTimeout);
      if (videoFallback) {
        videoFallback.removeEventListener("seeked", handleSeeked);
        videoFallback.removeEventListener("stalled", handleSeeked);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="scroll-video-container"
      className="fixed inset-x-0 -top-[10%] bottom-0 z-[1] h-[120vh] w-full bg-[#030303]"
    >
      {/* High-performance Pre-rendered Canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          isPreloaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Low-latency Fallback native video */}
      <video
        ref={videoFallbackRef}
        muted
        playsInline
        preload="auto"
        src={resolvedVideoUrl}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          isPreloaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />

      {/* Minimal bottom progress loader shown only when extracting frames */}
      {!isPreloaded && preloadProgress > 0 && preloadProgress < 100 && (
        <div className="absolute bottom-6 right-8 z-20 flex items-center gap-2.5 bg-black/70 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-brand-blue transition-all duration-300"
              style={{ width: `${preloadProgress}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-gray-400">
            PRE-RENDERING {preloadProgress}%
          </span>
        </div>
      )}

      {/* Atmospheric darkening overlay */}
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />
    </div>
  );
}

import React, { useEffect, useRef } from "react";

export default function FixedCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      const grid = gridRef.current;
      const trigger = document.getElementById("cards-trigger");
      
      if (!container || !grid || !trigger) return;

      const rect = trigger.getBoundingClientRect();
      const triggerTop = rect.top + window.scrollY;
      const triggerHeight = rect.height;
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // Scroll bounds for card behavior
      const start = triggerTop - vh * 0.5;
      const end = triggerTop + triggerHeight - vh * 0.3;
      const range = end - start;

      let progress = range > 0 ? (scrollY - start) / range : 0;
      progress = Math.max(0, Math.min(1, progress));

      // Calculate container opacity with entry and exit fades
      const isActive = scrollY >= start - vh * 0.2 && scrollY <= end + vh * 0.3;
      const fadeIn = Math.min(1, Math.max(0, (scrollY - (start - vh * 0.2)) / (vh * 0.2)));
      const fadeOut = Math.min(1, Math.max(0, (end + vh * 0.3 - scrollY) / (vh * 0.3)));
      const opacity = isActive ? Math.min(fadeIn, fadeOut) : 0;

      container.style.opacity = opacity.toString();
      container.style.pointerEvents = opacity > 0.1 ? "auto" : "none";

      // Calculate reveal percentage based on layout
      const isMobile = window.innerWidth < 768;
      const revealPct = progress * 135;

      if (isMobile) {
        const maskStyle = `linear-gradient(to bottom, black ${revealPct}%, transparent ${revealPct + 20}%)`;
        grid.style.maskImage = maskStyle;
        grid.style.webkitMaskImage = maskStyle;
      } else {
        const maskStyle = `linear-gradient(to right, black ${revealPct}%, transparent ${revealPct + 15}%)`;
        grid.style.maskImage = maskStyle;
        grid.style.webkitMaskImage = maskStyle;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    
    // Initial run to configure visibility instantly on load
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="fixed-cards"
      className="fixed bottom-0 left-0 right-0 z-[4] px-6 py-8 md:px-12 md:py-12 opacity-0 pointer-events-none transition-opacity duration-150 ease-out"
    >
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-6xl mx-auto"
      >
        {/* Card 1 */}
        <div className="flex flex-col select-none rounded-xl border border-white/[0.04] bg-neutral-900/60 p-6 md:p-8 backdrop-blur-md shadow-2xl shadow-black/80 hover:border-white/[0.08] hover:bg-neutral-900/70 transition-all duration-300">
          <h3 className="text-lg font-bold text-white mb-3 md:mb-4 tracking-tight">
            Explore ASHUR
          </h3>
          <p className="text-xs md:text-sm text-gray-300 font-normal leading-relaxed">
            Ashur merges the elegance of Svelte 5 and modern React architectures with the performance of Three.js within easy reach. It's crafted to be robust and adaptable while remaining highly intuitive to master.
          </p>
        </div>

        {/* Card 2 */}
        <div className="flex flex-col select-none rounded-xl border border-white/[0.04] bg-neutral-900/60 p-6 md:p-8 backdrop-blur-md shadow-2xl shadow-black/80 hover:border-white/[0.08] hover:bg-neutral-900/70 transition-all duration-300">
          <h3 className="text-lg font-bold text-white mb-3 md:mb-4 tracking-tight">
            Unlock Three.js
          </h3>
          <p className="text-xs md:text-sm text-gray-300 font-normal leading-relaxed">
            The web is growing increasingly dimensional. At its heart, Ashur offers a composable declarative API for building performant, responsive Three.js and webXR experiences on top of existing frameworks.
          </p>
        </div>

        {/* Card 3 */}
        <div className="flex flex-col select-none rounded-xl border border-white/[0.04] bg-neutral-900/60 p-6 md:p-8 backdrop-blur-md shadow-2xl shadow-black/80 hover:border-white/[0.08] hover:bg-neutral-900/70 transition-all duration-300">
          <h3 className="text-lg font-bold text-white mb-3 md:mb-4 tracking-tight">
            Connect Everything
          </h3>
          <p className="text-xs md:text-sm text-gray-300 font-normal leading-relaxed">
            Ashur ships with production-ready tooling for rigid physics, XR controllers, layout systems, glTF model loaders, and extensive helpers to make building 3D apps completely effortless.
          </p>
        </div>
      </div>
    </div>
  );
}

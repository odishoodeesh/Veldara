import React, { useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const hero = heroRef.current;
      if (!hero) return;

      const scrollY = window.scrollY;
      const threshold = window.innerHeight * 0.4;
      const opacity = Math.max(0, 1 - scrollY / threshold);
      
      hero.style.opacity = opacity.toString();
      hero.style.pointerEvents = opacity < 0.05 ? "none" : "auto";
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToContent = () => {
    const trigger = document.getElementById("cards-trigger");
    if (trigger) {
      trigger.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex h-screen w-full flex-col justify-end text-center transition-opacity duration-150 ease-out"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-24 md:pb-32">
        <h1 className="text-6xl font-black tracking-[0.2em] leading-none text-white sm:text-8xl md:text-9xl select-none uppercase">
          ASHUR
        </h1>
      </div>

      {/* Down bouncing arrow */}
      <button
        onClick={handleScrollToContent}
        className="relative z-10 flex justify-center pb-8 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        aria-label="Scroll to details"
      >
        <ArrowDown className="w-6 h-6 text-gray-500 animate-bounce-slow" />
      </button>
    </section>
  );
}

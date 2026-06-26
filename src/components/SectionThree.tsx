import React, { useEffect, useRef, useState } from "react";

export default function SectionThree() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Unobserve once seen to maintain visible state on further scrolls
          observer.unobserve(section);
        }
      },
      {
        threshold: 0.2, // Trigger when 20% of section enters viewport
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      id="section-three"
      className="relative min-h-[100vh] flex items-end justify-center px-6 pb-24 md:pb-32 bg-transparent overflow-hidden"
    >
      <div
        ref={sectionRef}
        className={`relative z-10 flex flex-col items-center text-center transition-all duration-[1200ms] ease-out ${
          isVisible
            ? "opacity-100 translate-y-0 blur-0"
            : "opacity-0 translate-y-8 blur-[10px]"
        }`}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3 select-none">
          Presenting
        </p>
        <h2 className="text-4xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none">
          ASHUR
        </h2>
      </div>
    </section>
  );
}

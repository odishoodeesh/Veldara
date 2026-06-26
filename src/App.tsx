import React from "react";
import Navigation from "./components/Navigation";
import ScrollVideo from "./components/ScrollVideo";
import Particles from "./components/Particles";
import Hero from "./components/Hero";
import FixedCards from "./components/FixedCards";
import SectionThree from "./components/SectionThree";

export default function App() {
  return (
    <div className="relative min-h-screen bg-transparent text-white overflow-x-hidden selection:bg-brand-blue selection:text-white">
      {/* Immersive Scroll Video Background */}
      <ScrollVideo />

      {/* Interactive Ambient Particles */}
      <Particles />

      {/* Floating Header Navigation */}
      <Navigation />

      {/* Scroll-Revealed Description Cards */}
      <FixedCards />

      {/* Main Page Scroll Layout */}
      <main id="content" className="relative z-10 flex flex-col w-full">
        {/* Section 1: Hero Cover */}
        <Hero />

        {/* Cinematic spacing between Hero and fixed card trigger zone */}
        <div style={{ height: "150vh" }} className="pointer-events-none" />

        {/* Scroll activation boundary for Fixed Cards.
            As the user scrolls through this 200vh zone, the cards slide/fade into view
            and unmask sequentially based on vertical progression. */}
        <div id="cards-trigger" style={{ height: "200vh" }} className="relative pointer-events-none" />

        {/* Transition buffer before concluding segment */}
        <div style={{ height: "100vh" }} className="pointer-events-none" />

        {/* Section 3: Concluding Presentation Segment */}
        <SectionThree />
      </main>
    </div>
  );
}

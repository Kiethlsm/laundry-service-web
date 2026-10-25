"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** One scroll-linked scene. No animation loop, scroll interception or React renders. */
export function ScrollScene({ children }: { children: ReactNode }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = true;
    const paint = () => {
      frame = 0;
      if (preference.matches || document.hidden || !visible) return;
      const rect = scene.getBoundingClientRect();
      const distance = Math.max(rect.height, window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      scene.style.setProperty("--scene-progress", progress.toFixed(4));
    };
    const schedule = () => {
      if (!frame && visible && !preference.matches)
        frame = requestAnimationFrame(paint);
    };
    const updatePreference = () => {
      scene.style.setProperty("--scene-progress", "0");
      schedule();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    observer.observe(scene);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    preference.addEventListener("change", updatePreference);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      preference.removeEventListener("change", updatePreference);
    };
  }, []);
  return (
    <div className="hero-scroll" ref={sceneRef}>
      {children}
    </div>
  );
}

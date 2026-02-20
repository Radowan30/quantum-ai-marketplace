import React, { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export function HolographicCard({
  children,
  className,
  spotlightColor = "rgba(139, 92, 246, 0.25)",
}: HolographicCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse position for spotlight (raw pixels)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Rotation values (degrees)
  // Reduced stiffness for smoother, more "gliding" tilt
  const rotateX = useSpring(0, { stiffness: 200, damping: 25 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 25 });

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const relativeX = clientX - left;
    const relativeY = clientY - top;

    // Update spotlight immediately
    mouseX.set(relativeX);
    mouseY.set(relativeY);

    // Tilt Logic
    const xPct = (relativeX / width) - 0.5;
    const yPct = (relativeY / height) - 0.5;

    // Look at mouse: 
    // yPct is -0.5 (top) -> rotateX should be negative (top tips forward) -> 0.5 * 20 = 10... wait
    // If yPct = -0.5. We want -10.
    // -0.5 * 20 = -10. Correct.
    rotateX.set(yPct * 20);
    
    // xPct is -0.5 (left) -> rotateY should be positive (left tips forward).
    // -0.5 * -20 = 10. Correct.
    rotateY.set(xPct * -20);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div
      ref={containerRef}
      className="relative z-0 group perspective-1000 w-full h-full"
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className={cn(
          "relative w-full h-full rounded-xl border border-white/10 bg-black/40",
          className
        )}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Content Container */}
        <div className="relative h-full z-20">
          {children}
        </div>

        {/* Spotlight Overlay (Moved to top z-30 to avoid occlusion by child backgrounds) */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100 z-30"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                650px circle at ${mouseX}px ${mouseY}px,
                ${spotlightColor},
                transparent 80%
              )
            `,
            mixBlendMode: "overlay" 
          }}
        />
      </motion.div>
    </div>
  );
}

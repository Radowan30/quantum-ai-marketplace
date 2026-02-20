import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightTextProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export function SpotlightText({
  children,
  className,
  spotlightColor = "rgba(139, 92, 246, 1)", // Primary Violet
}: SpotlightTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const opacity = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  function handleMouseEnter() {
    opacity.set(1);
  }

  function handleMouseLeave() {
    opacity.set(0);
  }

  return (
    <div
      ref={ref}
      className={cn("relative inline-block overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Base Text (Visible State) */}
      <div className="relative z-0">{children}</div>

      {/* Glowing Overlay (Revealed by mask) */}
      <motion.div
        className="absolute inset-0 z-10 text-white pointer-events-none"
        style={{
          maskImage: useMotionTemplate`
            radial-gradient(
              100px circle at ${mouseX}px ${mouseY}px,
              black,
              transparent 80%
            )
          `,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              100px circle at ${mouseX}px ${mouseY}px,
              black,
              transparent 80%
            )
          `,
          color: spotlightColor,
          textShadow: `0 0 10px ${spotlightColor}, 0 0 20px ${spotlightColor}`,
          mixBlendMode: "lighten",
          opacity
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

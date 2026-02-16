import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

interface WaveBackgroundProps {
  className?: string;
  intensity?: "subtle" | "medium" | "bold";
}

export function WaveBackground({
  className = "",
  intensity = "medium"
}: WaveBackgroundProps) {
  // Mouse tracking for interactive parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animations for mouse movement
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Normalize mouse position to -1 to 1 range
      const x = (clientX / innerWidth - 0.5) * 2;
      const y = (clientY / innerHeight - 0.5) * 2;

      mouseX.set(x * 50); // Multiply for parallax intensity
      mouseY.set(y * 50);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Base dark gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#1A1625] to-[#0A0A0F]" />

      {/* Flowing wave SVG pattern - Creates actual wave shapes - MINIMAL BLUR + DARKER COLORS */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="-200 0 2400 1000"
      >
        <defs>
          {/* DARKER gradients for better text contrast */}
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5B3FA8" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#3C2F7D" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#5B3FA8" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="wave-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3E5B8F" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#4A3684" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2F3B6E" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="wave-gradient-3" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#6B5AAF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#4A3684" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Wave Layer 1 - Flowing sine wave - MOUSE REACTIVE - EXTENDS BEYOND VIEWPORT */}
        <motion.path
          d="M-400,200 Q-150,100 100,200 T600,200 Q850,300 1100,200 T1600,200 Q1850,100 2100,200 T2600,200 L2600,1000 L-400,1000 Z"
          fill="url(#wave-gradient-1)"
          style={{
            x: smoothMouseX,
            y: smoothMouseY,
            filter: "blur(12px)", // FURTHER REDUCED
          }}
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Wave Layer 2 - Offset wave for depth - MOUSE REACTIVE - EXTENDS BEYOND VIEWPORT */}
        <motion.path
          d="M-400,350 Q-100,250 200,350 T800,350 Q1100,450 1400,350 T2000,350 Q2300,250 2600,350 L2600,1000 L-400,1000 Z"
          fill="url(#wave-gradient-2)"
          style={{
            x: smoothMouseX,
            y: smoothMouseY,
            filter: "blur(15px)", // FURTHER REDUCED
          }}
          animate={{
            y: [-15, 25, -15],
            x: [-50, 50, -50]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Wave Layer 3 - Subtle top wave - MOUSE REACTIVE - EXTENDS BEYOND VIEWPORT */}
        <motion.path
          d="M-400,100 Q-50,50 300,100 T900,100 Q1250,150 1600,100 T2200,100 Q2550,50 2900,100 L2900,500 L-400,500 Z"
          fill="url(#wave-gradient-3)"
          style={{
            x: smoothMouseX,
            y: smoothMouseY,
            filter: "blur(18px)", // FURTHER REDUCED
          }}
          animate={{
            y: [-10, 15, -10],
            x: [30, -30, 30]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </svg>

      {/* Floating energy orbs - MOUSE REACTIVE - DARKER & LESS BLUR */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(91, 63, 168, 0.22) 0%, transparent 70%)",
          filter: "blur(35px)", // FURTHER REDUCED
          x: smoothMouseX,
          y: smoothMouseY,
        }}
        animate={{
          x: [-50, 50, -50],
          y: [-30, 30, -30],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(62, 91, 143, 0.18) 0%, transparent 70%)",
          filter: "blur(40px)", // FURTHER REDUCED
          x: smoothMouseX,
          y: smoothMouseY,
        }}
        animate={{
          x: [40, -40, 40],
          y: [20, -20, 20],
          scale: [1.1, 0.9, 1.1],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Gradient fade to background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0F]/30 to-[#0A0A0F] pointer-events-none" />
    </div>
  );
}

import { motion } from "framer-motion";

interface CircuitOverlayProps {
  className?: string;
  opacity?: number;
  animated?: boolean;
}

export function CircuitOverlay({
  className = "",
  opacity = 0.2,
  animated = true
}: CircuitOverlayProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ isolation: "isolate" }}
      >
        <defs>
          {/* Circuit grid pattern */}
          <pattern
            id="circuit-grid"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            {/* Horizontal lines */}
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              stroke="#A78BFA"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.4"
            />
            {/* Vertical lines */}
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="100"
              stroke="#A78BFA"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.4"
            />
            {/* Circuit nodes */}
            <circle
              cx="50"
              cy="50"
              r="2.5"
              fill="#A78BFA"
              opacity="0.6"
              style={{ filter: "drop-shadow(0 0 4px #A78BFA)" }}
            />
            {/* Smaller nodes */}
            <circle cx="0" cy="0" r="1.5" fill="#7855DD" opacity="0.4" />
            <circle cx="100" cy="0" r="1.5" fill="#7855DD" opacity="0.4" />
            <circle cx="0" cy="100" r="1.5" fill="#7855DD" opacity="0.4" />
            <circle cx="100" cy="100" r="1.5" fill="#7855DD" opacity="0.4" />
          </pattern>

          {/* Animated energy pulse gradient */}
          {animated && (
            <linearGradient id="pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0" />
              <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
              <animate
                attributeName="x1"
                values="-100%;100%"
                dur="5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="0%;200%"
                dur="5s"
                repeatCount="indefinite"
              />
            </linearGradient>
          )}
        </defs>

        {/* Apply circuit pattern */}
        <rect width="100%" height="100%" fill="url(#circuit-grid)" />

        {/* Animated energy pulse lines */}
        {animated && (
          <>
            <motion.line
              x1="0%"
              y1="20%"
              x2="100%"
              y2="20%"
              stroke="url(#pulse-gradient)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.line
              x1="0%"
              y1="60%"
              x2="100%"
              y2="60%"
              stroke="url(#pulse-gradient)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
                delay: 2.5,
              }}
            />
          </>
        )}
      </svg>
    </div>
  );
}

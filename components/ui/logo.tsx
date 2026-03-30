import { Utensils } from "lucide-react";

interface CampusBiteLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: { icon: 20, box: 36, text: "text-xl" },
  md: { icon: 28, box: 52, text: "text-2xl" },
  lg: { icon: 36, box: 80, text: "text-4xl" },
};

export function CampusBiteLogo({
  size = "md",
  className = "",
  showText = true,
}: CampusBiteLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="glass-card glow-border rounded-2xl flex items-center justify-center"
        style={{ width: s.box, height: s.box }}
      >
        <Utensils size={s.icon} className="text-primary-container" />
      </div>
      {showText && (
        <span
          className={`font-extrabold tracking-tighter text-on-surface ${s.text}`}
        >
          CampusBite
        </span>
      )}
    </div>
  );
}

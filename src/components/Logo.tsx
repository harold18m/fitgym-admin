import Image from "next/image";
import React from "react";

export type LogoProps = {
  size?: number;
  withText?: boolean;
  className?: string;
  textClassName?: string;
  alt?: string;
};

export function Logo({
  size = 28,
  withText = true,
  className = "",
  textClassName = "",
  alt = "FitGym logo",
}: LogoProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-2 py-1 ${className}`}
      aria-label="FitGym"
    >
      <Image
        src="/fitgym-logo.png"
        width={size}
        height={size}
        alt={alt}
        priority={false}
      />
      {withText && (
        <span className={`font-bold tracking-tight ${textClassName}`}>FitGym</span>
      )}
    </div>
  );
}

export default Logo;
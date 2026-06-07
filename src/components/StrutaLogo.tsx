"use client";

import React from "react";
import { cn } from "@/lib/utils";

type LogoSize = "favicon" | "small" | "normal" | "big";

const sizeClasses: Record<LogoSize, string> = {
  favicon: "h-6 w-6",
  small: "h-8 w-8",
  normal: "h-9 w-9",
  big: "h-24 w-24 md:h-32 md:w-32",
};

interface StrutaLogoProps {
  size?: LogoSize;
  className?: string;
  alt?: string;
}

export const StrutaLogo = ({ size = "normal", className, alt = "Struta" }: StrutaLogoProps) => (
  <picture>
    <source srcSet="/struta_dark_mode.png" media="(prefers-color-scheme: dark)" />
    <source srcSet="/struta_light_mode.png" media="(prefers-color-scheme: light)" />
    <img
      src="/struta_light_mode.png"
      alt={alt}
      className={cn("object-contain shrink-0", sizeClasses[size], className)}
      width={size === "big" ? 128 : size === "normal" ? 36 : size === "small" ? 32 : 24}
      height={size === "big" ? 128 : size === "normal" ? 36 : size === "small" ? 32 : 24}
    />
  </picture>
);

export default StrutaLogo;

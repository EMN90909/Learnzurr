import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className,
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
  fallbackSrc?: string;
};

const isUsableSrc = (src: unknown) => {
  const value = String(src || "").trim();
  return Boolean(value && value !== "null" && value !== "undefined" && !value.startsWith("blob:null"));
};

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, src, fallbackSrc = "/struta_light_mode.png", onError, ...props }, ref) => {
  const initialSrc = isUsableSrc(src) ? String(src) : fallbackSrc;
  const [currentSrc, setCurrentSrc] = React.useState(initialSrc);

  React.useEffect(() => {
    setCurrentSrc(isUsableSrc(src) ? String(src) : fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={currentSrc}
      className={cn("aspect-square h-full w-full object-cover", className)}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
        onError?.(event);
      }}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    delayMs={150}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };

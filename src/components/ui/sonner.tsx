import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const getCurrentTheme = (): ToasterProps["theme"] => {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") || document.documentElement.dataset.theme === "dark" ? "dark" : "light";
};

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={getCurrentTheme()}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

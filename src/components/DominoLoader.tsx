"use client";

interface DominoLoaderProps {
  message?: string;
  fullscreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function DominoLoader({
  message = "Loading...",
  fullscreen = false,
  size = "md",
}: DominoLoaderProps) {
  const sizeClass = size === "sm" ? "scale-75" : size === "lg" ? "scale-125" : "";
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center" role="status" aria-live="polite">
      <style>{`
        @keyframes loader {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .loader {
          position: relative;
          width: 50px;
          height: 50px;
        }
        .square {
          background: #ddd;
          width: 10px;
          height: 10px;
          position: absolute;
          top: 50%;
          left: 50%;
          margin-top: -5px;
          margin-left: -5px;
          border-radius: 2px;
          box-shadow: 0 0 16px rgba(200, 146, 58, 0.18);
        }
        .sq1 {
          margin-top: -25px;
          margin-left: -25px;
          animation: loader 675ms ease-in-out 0s infinite alternate;
        }
        .sq2 {
          margin-top: -25px;
          animation: loader 675ms ease-in-out 75ms infinite alternate;
        }
        .sq3 {
          margin-top: -25px;
          margin-left: 15px;
          animation: loader 675ms ease-in-out 150ms infinite;
        }
        .sq4 {
          margin-left: -25px;
          animation: loader 675ms ease-in-out 225ms infinite;
        }
        .sq5 {
          animation: loader 675ms ease-in-out 300ms infinite;
        }
        .sq6 {
          margin-left: 15px;
          animation: loader 675ms ease-in-out 375ms infinite;
        }
        .sq7 {
          margin-top: 15px;
          margin-left: -25px;
          animation: loader 675ms ease-in-out 450ms infinite;
        }
        .sq8 {
          margin-top: 15px;
          animation: loader 675ms ease-in-out 525ms infinite;
        }
        .sq9 {
          margin-top: 15px;
          margin-left: 15px;
          animation: loader 675ms ease-in-out 600ms infinite;
        }
      `}</style>
      <div className={`loader ${sizeClass}`} aria-hidden="true">
        <div className="square sq1" />
        <div className="square sq2" />
        <div className="square sq3" />
        <div className="square sq4" />
        <div className="square sq5" />
        <div className="square sq6" />
        <div className="square sq7" />
        <div className="square sq8" />
        <div className="square sq9" />
      </div>
      {message && <p className="mt-5 text-sm font-black text-[#1692f8] tracking-wide animate-pulse">{message}</p>}
      <span className="sr-only">{message}</span>
    </div>
  );

  if (fullscreen) {
    return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--paper)]">{content}</div>;
  }

  return content;
}

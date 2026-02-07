"use client";

import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
};

export default function Button({
  children,
  variant = "default",
  style,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    background: variant === "ghost" ? "transparent" : "#1976d2",
    color: variant === "ghost" ? "#fff" : "#fff",
  };

  return (
    <button {...props} style={{ ...baseStyle, ...style }}>
      {children}
    </button>
  );
}

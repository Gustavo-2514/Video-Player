"use client";

import React from "react";

export default function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    background: "#f8f9fb",
    border: "1px solid #e6e9ee",
    padding: "0.5rem",
    borderRadius: 8,
  };

  return <div style={{ ...base, ...style }}>{children}</div>;
}

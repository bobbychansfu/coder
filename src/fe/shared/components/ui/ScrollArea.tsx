"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
  sx?: SxProps<Theme>;
  maxHeight?: string | number;
}

export default function ScrollArea({
  children,
  className,
  sx,
  maxHeight,
}: ScrollAreaProps) {
  const mergedClassName = ["scrollbar-thin", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Box
      className={mergedClassName}
      sx={{
        overflowY: "auto",
        maxHeight: maxHeight,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

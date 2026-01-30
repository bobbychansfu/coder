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
  return (
    <Box
      className={className}
      sx={{
        overflowY: "auto",
        maxHeight: maxHeight,
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "transparent",
          marginTop: "4px",
          marginBottom: "4px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#d1d5db",
          borderRadius: "4px",
          "&:hover": {
            backgroundColor: "#9ca3af",
          },
        },
        // Firefox scrollbar styling
        scrollbarWidth: "thin",
        scrollbarColor: "#d1d5db transparent",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

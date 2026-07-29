"use client";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";

interface AiHintDialogProps {
  open: boolean;
  loading: boolean;
  hint: string | null;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

export default function AiHintDialog({
  open,
  loading,
  hint,
  error,
  onClose,
  onRetry,
}: AiHintDialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const panel = panelRef.current;
      if (!panel) {
        return;
      }

      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const nextX = event.clientX - dragOffsetRef.current.x;
      const nextY = event.clientY - dragOffsetRef.current.y;

      setPosition({
        x: Math.min(Math.max(8, nextX), window.innerWidth - width - 8),
        y: Math.min(Math.max(8, nextY), window.innerHeight - height - 8),
      });
    };

    const handlePointerUp = () => {
      setDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setDragging(true);
  };

  if (!open) {
    return null;
  }

  const panelWidth = typeof window === "undefined" ? 420 : Math.min(420, window.innerWidth - 32);
  const effectivePosition =
    position ??
    (typeof window === "undefined"
      ? { x: 24, y: 88 }
      : {
          x: Math.max(16, window.innerWidth - panelWidth - 24),
          y: 88,
        });

  return (
    <Paper
      ref={panelRef}
      elevation={8}
      role="region"
      aria-label="AI Hint"
      sx={{
        position: "fixed",
        top: effectivePosition.y,
        left: effectivePosition.x,
        zIndex: (theme) => theme.zIndex.modal,
        width: { xs: "calc(100vw - 32px)", sm: 420 },
        maxHeight: "calc(100vh - 120px)",
        borderRadius: "8px",
        overflow: "hidden",
        cursor: dragging ? "grabbing" : "default",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap="12px"
        px="18px"
        py="14px"
        borderBottom="1px solid"
        borderColor="divider"
        onPointerDown={startDrag}
        sx={{ cursor: "grab", touchAction: "none", userSelect: "none" }}
      >
        <Box display="flex" alignItems="center" gap="10px">
          <DragIndicatorRoundedIcon fontSize="small" color="disabled" />
          <AutoAwesomeRoundedIcon fontSize="small" color="primary" />
          <Typography fontWeight={700}>AI Hint</Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label="Close AI hint"
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box px="18px" py="16px" maxHeight="calc(100vh - 240px)" overflow="auto">
        {loading ? (
          <Box display="flex" alignItems="center" gap="12px" py="8px">
            <CircularProgress size={18} />
            <Typography color="text.secondary">
              Generating a hint based on your current code...
            </Typography>
          </Box>
        ) : error ? (
          <Typography color="error" whiteSpace="pre-wrap">
            {error}
          </Typography>
        ) : (
          <Typography color="text.primary" whiteSpace="pre-wrap">
            {hint ?? "No hint generated yet."}
          </Typography>
        )}
      </Box>

      <Box
        display="flex"
        justifyContent="flex-end"
        gap="8px"
        px="14px"
        py="10px"
        borderTop="1px solid"
        borderColor="divider"
      >
        <Button onClick={onRetry} disabled={loading}>
          Regenerate
        </Button>
        <Button onClick={onClose}>Close</Button>
      </Box>
    </Paper>
  );
}

"use client";

import { Alert, Box, Button, Card, CardContent, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

interface ContestRegisterInviteProps {
  contestId: string;
  name: string;
  statusLabel: string;
  startsAtIso: string;
  joinCode?: string;
}

// Shown instead of the contest when a student opens a contest they can still register for.
export default function ContestRegisterInvite({
  contestId,
  name,
  statusLabel,
  startsAtIso,
  joinCode,
}: ContestRegisterInviteProps) {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setIsRegistering(true);
    setError(null);
    try {
      const response = await fetch(`/api/s/contest/register/${contestId}`, {
        method: "POST",
        credentials: "include",
        ...(joinCode
          ? { headers: { "content-type": "application/json" }, body: JSON.stringify({ joinCode }) }
          : {}),
      });
      if (!response.ok) {
        throw new Error("Failed to register contest.");
      }
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Failed to register contest.");
      setIsRegistering(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 560, mx: "auto", my: 6, px: 2 }}>
      <Card variant="outlined">
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h6">{name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {statusLabel} · Starts {new Date(startsAtIso).toLocaleString()}
          </Typography>
          <Typography>You are not registered for this contest.</Typography>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleRegister()}
            disabled={isRegistering}
            sx={{ alignSelf: "flex-start" }}
          >
            {isRegistering ? "Registering..." : "Register"}
          </Button>
          {error ? <Alert severity="error">{error}</Alert> : null}
        </CardContent>
      </Card>
    </Box>
  );
}

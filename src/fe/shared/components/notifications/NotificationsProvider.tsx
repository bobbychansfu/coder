"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Alert, Snackbar } from "@mui/material";
import { trpc } from "@/lib/trpc/client";
import {
  contestProblemHref,
  describeVerdict,
  type NotificationPayload,
} from "@/lib/notifications";

interface ViewedSubmissions {
  contestId: string;
  problemId: string;
}

interface NotificationsContextValue {
  notifications: NotificationPayload[];
  unreadCount: number;
  markAllRead: () => void;
  // The problem whose Submissions tab is on screen; its verdicts need no toast
  setViewedSubmissions: (viewed: ViewedSubmissions | null) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  return useContext(NotificationsContext);
}

// Keeps the bell's list current from the live stream and pops a toast per verdict.
export default function NotificationsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const list = trpc.notifications.list.useQuery(undefined, { staleTime: 30_000 });
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });
  const viewedSubmissionsRef = useRef<ViewedSubmissions | null>(null);
  const [toasts, setToasts] = useState<NotificationPayload[]>([]);

  useEffect(() => {
    const source = new EventSource("/api/notifications/stream");

    source.addEventListener("notification", (event) => {
      const notification = JSON.parse((event as MessageEvent<string>).data) as NotificationPayload;
      void utils.notifications.list.invalidate();

      const viewed = viewedSubmissionsRef.current;
      const onScreen =
        viewed?.contestId === notification.data.contestId &&
        viewed?.problemId === notification.data.problemId;
      if (notification.type === "VERDICT" && !onScreen) {
        setToasts((current) => [...current, notification]);
      }
    });
    // EventSource reconnects by itself; reload the list to pick up anything missed meanwhile
    source.addEventListener("connected", () => void utils.notifications.list.invalidate());

    return () => source.close();
  }, [utils]);

  const setViewedSubmissions = useCallback((viewed: ViewedSubmissions | null) => {
    viewedSubmissionsRef.current = viewed;
  }, []);
  const { mutate: markAllRead } = markAllReadMutation;

  const value = useMemo(
    () => ({
      notifications: list.data?.notifications ?? [],
      unreadCount: list.data?.unreadCount ?? 0,
      markAllRead: () => markAllRead(),
      setViewedSubmissions,
    }),
    [list.data, markAllRead, setViewedSubmissions],
  );

  const toast = toasts[0];
  const dismissToast = () => setToasts((current) => current.slice(1));

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.id}
        open={Boolean(toast)}
        autoHideDuration={6000}
        onClose={(_, reason) => {
          if (reason !== "clickaway") {
            dismissToast();
          }
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        {toast ? (
          <Alert
            severity={toast.data.status === "ACCEPTED" ? "success" : "error"}
            variant="filled"
            onClose={(event) => {
              event.stopPropagation();
              dismissToast();
            }}
            onClick={() => {
              router.push(contestProblemHref(toast.data));
              dismissToast();
            }}
            sx={{ cursor: "pointer", fontWeight: 600 }}
          >
            {describeVerdict(toast.data)}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotificationsContext.Provider>
  );
}

"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge, Box, IconButton, Menu, MenuItem } from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import { describeVerdict, notificationHref } from "@/lib/notifications";
import { useNotifications } from "./NotificationsProvider";
import styles from "../../styles/Navbar.module.css";

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(iso: string) {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (Math.abs(minutes) < 60) return relativeTime.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeTime.format(hours, "hour");
  return relativeTime.format(Math.round(hours / 24), "day");
}

export default function NotificationBell() {
  const router = useRouter();
  const notifications = useNotifications();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  // Opening marks everything read, so remember what was new to highlight it
  const [unreadWhenOpened, setUnreadWhenOpened] = useState<Set<string>>(new Set());

  if (!notifications) {
    return null;
  }

  const open = (event: MouseEvent<HTMLElement>) => {
    setAnchor(event.currentTarget);
    setUnreadWhenOpened(
      new Set(notifications.notifications.filter((item) => !item.readAt).map((item) => item.id)),
    );
    if (notifications.unreadCount > 0) {
      notifications.markAllRead();
    }
  };

  return (
    <>
      <IconButton aria-label="Notifications" onClick={open} className={styles.bellButton}>
        <Badge badgeContent={notifications.unreadCount} color="error" max={99}>
          <NotificationsNoneOutlinedIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { className: styles.notificationMenu } }}
      >
        {notifications.notifications.length === 0 ? (
          <MenuItem disabled>No notifications yet</MenuItem>
        ) : (
          notifications.notifications.map((item) => (
            <MenuItem
              key={item.id}
              className={unreadWhenOpened.has(item.id) ? styles.notificationUnread : undefined}
              onClick={() => {
                setAnchor(null);
                router.push(notificationHref(item));
              }}
            >
              {item.type === "VERDICT" ? (
                <Box className={styles.notificationItem}>
                  <span
                    className={
                      item.data.status === "ACCEPTED"
                        ? styles.notificationAccepted
                        : styles.notificationRejected
                    }
                  >
                    {describeVerdict(item.data)}
                  </span>
                  <span className={styles.notificationMeta}>
                    {item.data.problemTitle} · {timeAgo(item.createdAt)}
                  </span>
                </Box>
              ) : (
                <Box className={styles.notificationItem}>
                  <span className={styles.notificationInvite}>
                    {item.data.invitedByName} invited you to {item.data.teamName}
                  </span>
                  <span className={styles.notificationMeta}>
                    {item.data.contestName} · {timeAgo(item.createdAt)}
                  </span>
                </Box>
              )}
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}

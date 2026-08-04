"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { AppBar, Toolbar, Box, ButtonBase } from "@mui/material";
import styles from "../../styles/Navbar.module.css";
import { can } from "@/lib/authz";
import type { CurrentUser } from "@/lib/session";

interface NavbarProps {
  user: CurrentUser;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileButtonRef = useRef<HTMLButtonElement | null>(null);
  const permissions = can(user.role);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const getLinkClass = (href: string, extraClass?: string) =>
    [
      styles.navLink,
      isActive(href) ? styles.navLinkActive : "",
      extraClass ?? "",
    ]
      .filter(Boolean)
      .join(" ");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        profileMenuRef.current?.contains(target) ||
        profileButtonRef.current?.contains(target)
      ) {
        return;
      }
      setIsProfileOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <AppBar position="sticky" className={styles.navbar} elevation={0} color="transparent">
      <Toolbar className={styles.toolbar}>
        <Box className={styles.leftGroup}>
          <Link href="/dashboard" className={styles.logo}>
            CODER
          </Link>
          <Box className={styles.navLinks}>
            {permissions.showDashboardTab ? (
              <Link href="/dashboard" className={getLinkClass("/dashboard")}>
                Dashboard
              </Link>
            ) : null}
            {permissions.showContestsTab ? (
              <Link href="/contests" className={getLinkClass("/contests")}>
                Contests
              </Link>
            ) : null}
            {permissions.showPracticeTab ? (
              <Link href="/practice" className={getLinkClass("/practice")}>
                Practice
              </Link>
            ) : null}
            {permissions.showInstructorTab ? (
              <Link href="/instructor" className={getLinkClass("/instructor")}>
                Instructor
              </Link>
            ) : null}
            {permissions.showAdminTab ? (
              <Link
                href="/admin"
                className={getLinkClass("/admin", styles.navLinkAdmin)}
              >
                <ShieldOutlinedIcon className={styles.icon} />
                Admin
              </Link>
            ) : null}
          </Box>
        </Box>

        <Box className={styles.profileMenuWrapper}>
          <ButtonBase
            ref={profileButtonRef}
            className={`${styles.profileButton} ${
              isActive("/profile") ? styles.navLinkActive : ""
            }`}
            aria-haspopup="menu"
            aria-expanded={isProfileOpen}
            aria-controls="profile-menu"
            onClick={() => setIsProfileOpen((prev) => !prev)}
          >
            <PersonOutlineIcon className={styles.profileIcon} />
            Profile
          </ButtonBase>
          {isProfileOpen ? (
            <Box
              id="profile-menu"
              ref={profileMenuRef}
              className={styles.profileMenu}
              role="menu"
              aria-label="Profile menu"
            >
              <Box className={styles.profileMenuHeader}>
                <Box className={styles.profileMetaRow}>
                  <Box component="span" className={styles.profileRole}>
                    {user.accountType === "guest" ? "guest" : user.role}
                  </Box>
                  <Box component="span" className={styles.profileName}>{user.displayName}</Box>
                </Box>
                <Box className={styles.profileEmailRow}>
                  <MailOutlineIcon className={styles.profileEmailIcon} />
                  <Box component="span" className={styles.profileEmail}>
                    Email: {user.accountType === "guest" ? "" : user.identifier}
                  </Box>
                </Box>
              </Box>
              <Box className={styles.profileDivider} />
              <Link
                href="/profile"
                className={styles.profileMenuItem}
                onClick={() => setIsProfileOpen(false)}
              >
                <PersonOutlineIcon className={styles.profileMenuIcon} />
                View Profile
              </Link>
              <Box className={styles.profileDivider} />
              <ButtonBase
                className={`${styles.profileMenuItem} ${styles.profileLogout}`}
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out…" : "Log out"}
              </ButtonBase>
            </Box>
          ) : null}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

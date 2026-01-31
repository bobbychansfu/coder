"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { AppBar, Toolbar, Box, ButtonBase } from "@mui/material";
import styles from "../../styles/Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileButtonRef = useRef<HTMLButtonElement | null>(null);

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
          <Link href="/" className={styles.logo}>
            CODER
          </Link>
          <Box className={styles.navLinks}>
            <Link href="/" className={getLinkClass("/")}>
              Dashboard
            </Link>
            <Link href="/contests" className={getLinkClass("/contests")}>
              Contests
            </Link>
            <Link href="/practice" className={getLinkClass("/practice")}>
              Practice
            </Link>
            <Link href="/instructor" className={getLinkClass("/instructor")}>
              Instructor
            </Link>
            <Link
              href="/admin"
              className={getLinkClass("/admin", styles.navLinkAdmin)}
            >
              <ShieldOutlinedIcon className={styles.icon} />
              Admin
            </Link>
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
                  <Box component="span" className={styles.profileRole}>admin</Box>
                  <Box component="span" className={styles.profileName}>Alex Chen</Box>
                </Box>
                <Box className={styles.profileEmailRow}>
                  <MailOutlineIcon className={styles.profileEmailIcon} />
                  <Box component="span" className={styles.profileEmail}>
                    alex.chen@sfu.ca
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
              >
                Log out
              </ButtonBase>
            </Box>
          ) : null}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

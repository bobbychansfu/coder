"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import styles from "../../styles/Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();

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

  return (
    <nav className={styles.navbar}>
      <div className={styles.toolbar}>
        <div className={styles.leftGroup}>
          <Link href="/" className={styles.logo}>
            CODER
          </Link>
          <div className={styles.navLinks}>
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
          </div>
        </div>

        {/* Profile Button */}
        <Link
          href="/profile"
          className={`${styles.profileButton} ${
            isActive("/profile") ? styles.navLinkActive : ""
          }`}
        >
          <PersonOutlineIcon className={styles.profileIcon} />
          Profile
        </Link>
      </div>
    </nav>
  );
}

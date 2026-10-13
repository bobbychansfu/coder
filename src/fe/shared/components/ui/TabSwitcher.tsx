import Link from "next/link";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import styles from "@/fe/shared/styles/TabSwitcher.module.css";

interface TabOption {
  value: string;
  label: string;
  // Makes the tab a link, so the switcher can move between pages
  href?: string;
}

interface TabSwitcherProps {
  value: string;
  options: TabOption[];
  onChange?: (value: string) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
  className?: string;
}

export default function TabSwitcher({
  value,
  options,
  onChange,
  size = "md",
  ariaLabel = "Tabs",
  className,
}: TabSwitcherProps) {
  const switcherClass = [
    styles.switcher,
    size === "sm" ? styles.switcherSm : styles.switcherMd,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const buttonClass = `${styles.switcherButton} ${size === "sm" ? styles.switcherButtonSm : styles.switcherButtonMd}`;

  return (
    <ToggleButtonGroup
      className={switcherClass}
      value={value}
      exclusive
      onChange={(_, next) => next && onChange?.(next)}
      aria-label={ariaLabel}
    >
      {options.map((option) =>
        option.href ? (
          <ToggleButton
            key={option.value}
            value={option.value}
            className={buttonClass}
            disableRipple
            href={option.href}
            LinkComponent={Link}
          >
            {option.label}
          </ToggleButton>
        ) : (
          <ToggleButton key={option.value} value={option.value} className={buttonClass} disableRipple>
            {option.label}
          </ToggleButton>
        ),
      )}
    </ToggleButtonGroup>
  );
}

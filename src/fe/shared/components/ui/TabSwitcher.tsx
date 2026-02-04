import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import styles from "@/fe/shared/styles/TabSwitcher.module.css";

interface TabOption {
  value: string;
  label: string;
}

interface TabSwitcherProps {
  value: string;
  options: TabOption[];
  onChange: (value: string) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
}

export default function TabSwitcher({
  value,
  options,
  onChange,
  size = "md",
  ariaLabel = "Tabs",
}: TabSwitcherProps) {
  const switcherClass = `${styles.switcher} ${size === "sm" ? styles.switcherSm : styles.switcherMd}`;
  const buttonClass = `${styles.switcherButton} ${size === "sm" ? styles.switcherButtonSm : styles.switcherButtonMd}`;

  return (
    <ToggleButtonGroup
      className={switcherClass}
      value={value}
      exclusive
      onChange={(_, next) => next && onChange(next)}
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value} className={buttonClass} disableRipple>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

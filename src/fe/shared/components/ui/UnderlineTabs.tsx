import type { SvgIconComponent } from "@mui/icons-material";
import styles from "@/fe/shared/styles/UnderlineTabs.module.css";

interface UnderlineTabOption {
  value: string;
  label: string;
  icon?: SvgIconComponent;
  disabled?: boolean;
}

interface UnderlineTabsProps {
  value: string;
  options: UnderlineTabOption[];
  onChange?: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

export default function UnderlineTabs({
  value,
  options,
  onChange,
  ariaLabel = "Tabs",
  className,
}: UnderlineTabsProps) {
  const tabsClassName = [styles.tabs, className].filter(Boolean).join(" ");

  return (
    <div className={tabsClassName} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={option.disabled ? "true" : undefined}
            className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}
            onClick={() => !option.disabled && onChange?.(option.value)}
          >
            {Icon ? <Icon className={styles.tabIcon} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

import styles from "@/fe/shared/styles/PillFilterBar.module.css";

interface PillFilterOption {
  value: string;
  label: string;
}

interface PillFilterBarProps {
  value: string;
  options: PillFilterOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

export default function PillFilterBar({
  value,
  options,
  onChange,
  ariaLabel = "Filters",
  className,
}: PillFilterBarProps) {
  const wrapperClassName = [styles.wrapper, className].filter(Boolean).join(" ");

  return (
    <div className={wrapperClassName} role="toolbar" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${styles.pill} ${option.value === value ? styles.pillActive : ""}`}
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

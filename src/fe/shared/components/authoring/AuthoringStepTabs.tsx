import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import styles from "@/fe/shared/styles/AuthoringStepTabs.module.css";

export interface AuthoringStepTab {
  value: string;
  label: string;
  completed?: boolean;
  badgeCount?: number;
}

interface AuthoringStepTabsProps {
  value: string;
  tabs: AuthoringStepTab[];
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export default function AuthoringStepTabs({
  value,
  tabs,
  onChange,
  ariaLabel = "Authoring steps",
}: AuthoringStepTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab, index) => {
        const isActive = tab.value === value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}
            onClick={() => onChange(tab.value)}
          >
            <span className={styles.tabNumber}>
              {tab.completed && !isActive ? (
                <CheckRoundedIcon className={styles.checkIcon} />
              ) : (
                index + 1
              )}
            </span>
            <span>{tab.label}</span>
            {tab.badgeCount ? <span className={styles.countBadge}>{tab.badgeCount}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

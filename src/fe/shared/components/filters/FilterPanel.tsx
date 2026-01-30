"use client";

import styles from "../../styles/FilterPanel.module.css";

interface FilterOption {
  label: string;
  active?: boolean;
}

interface FilterGroup {
  label: string;
  options: FilterOption[];
}

interface FilterPanelProps {
  groups: FilterGroup[];
}

export default function FilterPanel({ groups }: FilterPanelProps) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Filters</h2>
      <div className={styles.groups}>
        {groups.map((group) => (
          <div key={group.label} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.label}</h3>
            <div className={styles.options}>
              {group.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className={`${styles.option} ${
                    option.active ? styles.optionActive : ""
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

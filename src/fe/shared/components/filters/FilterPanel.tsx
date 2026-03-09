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
  activeFilters?: Record<string, string>;
  onFilterChange?: (group: string, option: string) => void;
}

export default function FilterPanel({ groups, activeFilters, onFilterChange }: FilterPanelProps) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Filters</h2>
      <div className={styles.groups}>
        {groups.map((group) => (
          <div key={group.label} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.label}</h3>
            <div className={styles.options}>
              {group.options.map((option) => {
                const isActive = activeFilters
                  ? activeFilters[group.label] === option.label
                  : option.active;
                return (
                  <button
                    key={option.label}
                    type="button"
                    className={`${styles.option} ${isActive ? styles.optionActive : ""}`}
                    onClick={() => onFilterChange?.(group.label, option.label)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

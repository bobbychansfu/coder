"use client";

import SearchIcon from "@mui/icons-material/Search";
import styles from "../../styles/SearchInput.module.css";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function SearchInput({
  placeholder = "Search for ...",
  value,
  onChange,
}: SearchInputProps) {
  return (
    <div className={styles.wrapper}>
      <SearchIcon className={styles.icon} />
      <input
        className={styles.input}
        type="text"
        placeholder={placeholder}
        aria-label={placeholder}
        {...(onChange !== undefined
          ? { value: value ?? "", onChange: (e) => onChange(e.target.value) }
          : {})}
      />
    </div>
  );
}

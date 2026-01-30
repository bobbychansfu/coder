"use client";

import SearchIcon from "@mui/icons-material/Search";
import styles from "../../styles/SearchInput.module.css";

interface SearchInputProps {
  placeholder?: string;
}

export default function SearchInput({
  placeholder = "Search for ...",
}: SearchInputProps) {
  return (
    <div className={styles.wrapper}>
      <SearchIcon className={styles.icon} />
      <input
        className={styles.input}
        type="text"
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

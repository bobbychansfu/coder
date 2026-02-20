import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, InputAdornment, MenuItem, TextField } from "@mui/material";

import styles from "@/fe/admin/styles/ContestFiltersBar.module.css";

interface StatusOption {
  value: string;
  label: string;
}

interface ContestFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  statusOptions: StatusOption[];
}

export default function ContestFiltersBar({
  search,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  statusOptions,
}: ContestFiltersBarProps) {
  return (
    <Box className={styles.filtersCard}>
      <Box className={styles.searchFieldWrap}>
        <SearchRoundedIcon className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search contests by name or class..."
          aria-label="Search contests by name or class"
        />
      </Box>

      <TextField
        select
        size="small"
        value={selectedStatus}
        onChange={(event) => onStatusChange(event.target.value)}
        className={styles.statusFilter}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" className={styles.filterAdornment}>
              <FilterListRoundedIcon className={styles.filterIcon} />
            </InputAdornment>
          ),
        }}
        SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon }}
      >
        {statusOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}

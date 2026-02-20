import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, MenuItem, TextField } from "@mui/material";

import styles from "@/fe/admin/styles/UserFiltersBar.module.css";

interface RoleOption {
  value: string;
  label: string;
}

interface UserFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (value: string) => void;
  roleOptions: RoleOption[];
}

export default function UserFiltersBar({
  search,
  onSearchChange,
  selectedRole,
  onRoleChange,
  roleOptions,
}: UserFiltersBarProps) {
  return (
    <Box className={styles.filtersCard}>
      <Box className={styles.searchFieldWrap}>
        <SearchRoundedIcon className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search users by name or email..."
          aria-label="Search users by name or email"
        />
      </Box>

      <TextField
        select
        size="small"
        value={selectedRole}
        onChange={(event) => onRoleChange(event.target.value)}
        className={styles.roleFilter}
        SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon }}
      >
        {roleOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
}

"use client";

import { type MouseEvent, useState } from "react";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { IconButton, Menu, MenuItem } from "@mui/material";

import type { MenuActionItem } from "@/fe/shared/types/common";
import styles from "@/fe/shared/styles/RowActionsMenu.module.css";

interface RowActionsMenuProps {
  actions: MenuActionItem[];
  triggerAriaLabel: string;
  className?: string;
}

export default function RowActionsMenu({
  actions,
  triggerAriaLabel,
  className,
}: RowActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const buttonClassName = [styles.actionButton, className].filter(Boolean).join(" ");

  return (
    <>
      <IconButton
        size="small"
        className={buttonClassName}
        onClick={handleOpen}
        aria-label={triggerAriaLabel}
      >
        <MoreVertRoundedIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: { className: styles.menuPaper },
        }}
        MenuListProps={{ className: styles.menuList }}
      >
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <MenuItem
              key={action.id}
              className={`${styles.menuItem} ${action.danger ? styles.menuItemDanger : ""}`}
              disabled={action.disabled}
              onClick={() => {
                handleClose();
                action.onClick();
              }}
            >
              {Icon ? <Icon className={styles.menuIcon} /> : null}
              {action.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

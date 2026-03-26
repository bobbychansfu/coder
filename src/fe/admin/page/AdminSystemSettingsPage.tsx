"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Box, Button, Switch, TextField, Typography } from "@mui/material";

import { adminSystemSettingsData } from "@/fe/admin/data";
import SettingsCard from "@/fe/admin/components/SettingsCard";
import PageHeader from "@/fe/shared/components/PageHeader";
import SubpageHeader from "@/fe/shared/components/SubpageHeader";
import { ROUTES } from "@/fe/shared/constants/routes";
import subpageStyles from "@/fe/shared/styles/SubpageHeader.module.css";
import styles from "@/fe/admin/styles/AdminSystemSettingsPage.module.css";

export default function AdminSystemSettingsPage() {
  const router = useRouter();
  const [toggles, setToggles] = useState(adminSystemSettingsData.toggles);
  const [sessionTimeout, setSessionTimeout] = useState(
    String(adminSystemSettingsData.sessionTimeoutMinutes),
  );

  const handleToggleChange = (id: string) => {
    setToggles((current) =>
      current.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  const handleReset = () => {
    setToggles(adminSystemSettingsData.toggles);
    setSessionTimeout(String(adminSystemSettingsData.sessionTimeoutMinutes));
  };

  return (
    <Box className={styles.page}>
      <PageHeader
        onBack={() => router.push(ROUTES.admin)}
        backLabel="Back"
        backButtonClassName={subpageStyles.backButton}
      />

      <SubpageHeader
        title="System Settings"
        subtitle="Configure platform-wide settings and preferences"
      />

      <Box className={styles.sections}>
        <SettingsCard
          icon={SettingsOutlinedIcon}
          title={adminSystemSettingsData.contestSettingsTitle}
          description={adminSystemSettingsData.contestSettingsDescription}
        >
          {toggles.map((setting) => (
            <Box key={setting.id} className={styles.settingRow}>
              <Box className={styles.settingCopy}>
                <Typography className={styles.settingLabel}>{setting.label}</Typography>
                <Typography className={styles.settingDescription}>
                  {setting.description}
                </Typography>
              </Box>
              <Switch
                checked={setting.enabled}
                onChange={() => handleToggleChange(setting.id)}
                className={styles.settingSwitch}
              />
            </Box>
          ))}
        </SettingsCard>

        <SettingsCard
          icon={ShieldOutlinedIcon}
          title={adminSystemSettingsData.securityTitle}
          description={adminSystemSettingsData.securityDescription}
        >
          <Box className={styles.inputGroup}>
            <Typography className={styles.inputLabel}>
              {adminSystemSettingsData.sessionTimeoutLabel}
            </Typography>
            <TextField
              value={sessionTimeout}
              onChange={(event) => setSessionTimeout(event.target.value)}
              className={styles.input}
              size="small"
              type="number"
              inputProps={{ min: 1 }}
            />
          </Box>

          <Box className={styles.noteBox}>
            <Typography className={styles.noteText}>
              <span className={styles.noteLabel}>Note:</span>{" "}
              {adminSystemSettingsData.securityNote}
            </Typography>
          </Box>
        </SettingsCard>

        <Box className={styles.actions}>
          <Button
            variant="outlined"
            className={styles.resetButton}
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            className={styles.saveButton}
            startIcon={<SaveOutlinedIcon className={styles.saveButtonIcon} />}
          >
            Save Changes
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

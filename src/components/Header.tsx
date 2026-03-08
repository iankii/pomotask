import React from 'react';
import { LayoutGrid, Calendar, Users, BarChart3, Clock } from 'lucide-react';
import styles from './Header.module.css';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import useNotifications from '../hooks/useNotifications';

interface HeaderProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, onViewChange }) => {
  const tabs = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'board', label: 'Board', icon: LayoutGrid },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'time-log', label: 'Time Log', icon: Clock },
  ];

  const { permission, enabled, requestPermission, setEnabled } = useNotifications();

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked && permission !== 'granted') {
      const p = await requestPermission();
      setEnabled(p === 'granted');
    } else {
      setEnabled(checked);
    }
  };

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{ backgroundColor: 'var(--bg-secondary)' }}
      className={styles.header}
    >
      <Toolbar className={styles.container}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <div>
            <Typography variant="h6" component="div" className={styles.title}>
              📊 PomoTask
            </Typography>
            <Typography variant="body2" className={styles.subtitle}>
              This app saves tasks data using browser localstorage and doesn't need any DB — your data stays on your device.
            </Typography>
          </div>

          <nav className={styles.nav}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeView === tab.id ? styles.active : ''}`}
                  onClick={() => onViewChange(tab.id)}
                  title={tab.label}
                >
                  <Icon size={18} />
                  <span className={styles.label}>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={enabled ? 'Disable notifications' : 'Enable notifications'}>
            <IconButton
              color="inherit"
              onClick={() => {
                if (enabled) {
                  setEnabled(false);
                } else {
                  requestPermission().then((p) => setEnabled(p === 'granted'));
                }
              }}
            >
              {enabled ? <NotificationsIcon /> : <NotificationsOffIcon />}
            </IconButton>
          </Tooltip>
          <Switch checked={enabled} onChange={handleToggle} inputProps={{ 'aria-label': 'notifications' }} />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

import React from 'react';
import { LayoutGrid, Calendar, Users, BarChart3, Clock } from 'lucide-react';
import styles from './Header.module.css';

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

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h1 className={styles.title}>📊 Kanban Pomodoro</h1>
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
      </div>
    </header>
  );
};

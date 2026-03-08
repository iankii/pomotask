import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Clock } from 'lucide-react';
import styles from './PomodoroFloatingButton.module.css';

interface PomodoroFloatingButtonProps {
  onOpen: () => void;
}

export const PomodoroFloatingButton: React.FC<PomodoroFloatingButtonProps> = ({
  onOpen,
}) => {
  const pomodoroSessions = useStore((state) => state.pomodoroSessions);
  const activePomodoro = useStore((state) => state.activePomodoro);
  const [displayTime, setDisplayTime] = useState('');
  const [isCelebrating, setIsCelebrating] = useState(false);

  const sessionsToday = pomodoroSessions.filter((session) => {
    const today = new Date().toISOString().split('T')[0];
    const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
    return sessionDate === today;
  }).length;

  // Update display time every second
  useEffect(() => {
    if (activePomodoro?.isRunning) {
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      };
      setDisplayTime(formatTime(activePomodoro.timeLeft));

      const interval = setInterval(() => {
        setDisplayTime(formatTime(activePomodoro.timeLeft));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activePomodoro]);

  // Detect when timer completes and trigger celebration
  useEffect(() => {
    if (activePomodoro && !activePomodoro.isRunning && activePomodoro.timeLeft === 0 && !isCelebrating) {
      setIsCelebrating(true);
      // Stop celebrating after 2 seconds
      const timer = setTimeout(() => {
        setIsCelebrating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activePomodoro?.isRunning, activePomodoro?.timeLeft, isCelebrating]);

  return (
    <button
      className={`${styles.floatingButton} ${isCelebrating ? styles.celebrating : ''}`}
      onClick={onOpen}
      title={`Open Pomodoro Timer${activePomodoro?.isRunning ? ` - ${displayTime}` : ''}`}
    >
      <div className={styles.container}>
        <div className={styles.watchCircle}>
          <Clock size={28} />
        </div>
        {activePomodoro?.isRunning && (
          <div className={styles.timerBox}>
            <span className={styles.time}>{displayTime}</span>
          </div>
        )}
      </div>
      {sessionsToday > 0 && !activePomodoro?.isRunning && (
        <span className={styles.badge}>{sessionsToday}</span>
      )}
    </button>
  );
};

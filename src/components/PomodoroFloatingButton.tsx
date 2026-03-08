import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Clock, RotateCcw } from 'lucide-react';
import styles from './PomodoroFloatingButton.module.css';

interface PomodoroFloatingButtonProps {
  onOpen: () => void;
  onRestart?: () => void; // restart the last timer without opening the modal
}

export const PomodoroFloatingButton: React.FC<PomodoroFloatingButtonProps> = ({
  onOpen,
  onRestart,
}) => {
  const pomodoroSessions = useStore((state) => state.pomodoroSessions);
  const activePomodoro = useStore((state) => state.activePomodoro);
  const [displayTime, setDisplayTime] = useState('');
  const [isCelebrating, setIsCelebrating] = useState(false);

  const isCompleted = !!(activePomodoro?.completed);

  const sessionsToday = pomodoroSessions.filter((session) => {
    const today = new Date().toISOString().split('T')[0];
    const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
    return sessionDate === today;
  }).length;

  // Update display time every second while timer is running
  useEffect(() => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    if (!activePomodoro?.isRunning) {
      setDisplayTime('');
      return;
    }

    setDisplayTime(formatTime(activePomodoro.timeLeft));

    const interval = setInterval(() => {
      setDisplayTime(formatTime(activePomodoro.timeLeft));
    }, 1000);

    return () => clearInterval(interval);
  }, [activePomodoro]);

  // Trigger celebration animation reliably whenever completed flag appears
  useEffect(() => {
    if (isCompleted) {
      setIsCelebrating(true);
      const timer = setTimeout(() => setIsCelebrating(false), 2200);
      return () => clearTimeout(timer);
    }
  // Run whenever isCompleted changes to true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted]);

  return (
    <div className={styles.floatingWrapper}>
      {/* Main clock button */}
      <button
        className={`${styles.floatingButton} ${isCelebrating ? styles.celebrating : ''}`}
        onClick={onOpen}
        title={`Open Pomodoro Timer${activePomodoro?.isRunning ? ` - ${displayTime}` : ''}`}
      >
        <div className={styles.container}>
          <div className={`${styles.watchCircle} ${isCompleted ? styles.completedCircle : ''}`}>
            <Clock size={28} />
          </div>
          {activePomodoro?.isRunning && (
            <div className={styles.timerBox}>
              <span className={styles.time}>{displayTime}</span>
            </div>
          )}
          {isCompleted && (
            <div className={styles.completedBadgeBox}>
              <span className={styles.completedText}>Done! 🎉</span>
            </div>
          )}
        </div>
        {sessionsToday > 0 && !activePomodoro?.isRunning && !isCompleted && (
          <span className={styles.badge}>{sessionsToday}</span>
        )}
      </button>

      {/* Restart chip — appears right above the clock when timer is done */}
      {isCompleted && onRestart && (
        <button
          className={styles.restartChip}
          onClick={onRestart}
          title="Restart same timer"
        >
          <RotateCcw size={14} />
          Restart
        </button>
      )}
    </div>
  );
};

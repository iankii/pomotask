import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings } from 'lucide-react';
import styles from './PomodoroTimer.module.css';

type TimerMode = 'work' | 'shortBreak' | 'longBreak' | 'custom';

export const PomodoroTimer: React.FC = () => {
  const settings = useStore((state) => state.settings);
  const pomodoroSessions = useStore((state) => state.pomodoroSessions);
  const { setActivePomodoro, updateActivePomodoro, clearActivePomodoro } = useStore();
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroLength * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);

  const totalDuration = (() => {
    if (mode === 'custom') {
      return timeLeft;
    }
    return {
      work: settings.pomodoroLength * 60,
      shortBreak: settings.shortBreakLength * 60,
      longBreak: settings.longBreakLength * 60,
    }[mode] || 0;
  })();

  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

  const playCompletionSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Ring pattern with multiple tones
    const rings = [
      { freq: 800, duration: 0.3, delay: 0 },
      { freq: 1000, duration: 0.3, delay: 0.4 },
      { freq: 800, duration: 0.3, delay: 0.8 },
      { freq: 1200, duration: 0.4, delay: 1.2 },
    ];

    rings.forEach((ring) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = ring.freq;
      osc.type = 'sine';

      const startTime = audioContext.currentTime + ring.delay;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + ring.duration);

      osc.start(startTime);
      osc.stop(startTime + ring.duration);
    });
  }, []);

  const triggerVibration = useCallback(() => {
    if ('vibrate' in navigator) {
      // Pattern: vibrate for 100ms, pause 50ms, vibrate for 100ms, pause 50ms, vibrate for 100ms
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    // Update store when state changes
    if (isRunning) {
      setActivePomodoro({
        mode,
        timeLeft,
        isRunning: true,
        startTime: Date.now(),
      });
    } else if (timeLeft === 0 && !isRunning) {
      clearActivePomodoro();
    }

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTimeLeft = prev - 1;
          updateActivePomodoro({ timeLeft: newTimeLeft });
          return newTimeLeft;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, setActivePomodoro, updateActivePomodoro, clearActivePomodoro]);

  // Separate effect for handling completion
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      // Completion triggered - play sound and vibration
      if (soundEnabled) {
        playCompletionSound();
      }
      triggerVibration();
      
      // Schedule state changes
      const timer = setTimeout(() => {
        if (mode === 'work') {
          setSessionsCompleted((prev) => prev + 1);
          setMode(sessionsCompleted % 4 === 3 ? 'longBreak' : 'shortBreak');
        } else {
          setMode('work');
        }
        
        setIsRunning(false);
        clearActivePomodoro();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, isRunning, mode, sessionsCompleted, soundEnabled, playCompletionSound, triggerVibration, clearActivePomodoro]);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(totalDuration);
  };

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    let newDuration: number;
    
    if (newMode === 'custom') {
      newDuration = customMinutes * 60;
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      const durations = {
        work: settings.pomodoroLength * 60,
        shortBreak: settings.shortBreakLength * 60,
        longBreak: settings.longBreakLength * 60,
      };
      newDuration = durations[newMode];
    }
    setTimeLeft(newDuration);
  };

  const handleCustomTimeSet = () => {
    if (customMinutes > 0 && customMinutes <= 120) {
      setTimeLeft(customMinutes * 60);
      setShowCustomInput(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'work':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      case 'custom':
        return 'Custom Timer';
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'work':
        return '#3b82f6';
      case 'shortBreak':
        return '#10b981';
      case 'longBreak':
        return '#8b5cf6';
      case 'custom':
        return '#f59e0b';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Pomodoro Timer</h1>
        <p>Stay focused with the Pomodoro Technique</p>
      </div>

      <div className={styles.timerSection}>
        <div className={styles.modeSelector}>
          <button
            className={`${styles.modeBtn} ${mode === 'work' ? styles.active : ''}`}
            onClick={() => handleModeChange('work')}
            disabled={isRunning}
          >
            Work
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'shortBreak' ? styles.active : ''}`}
            onClick={() => handleModeChange('shortBreak')}
            disabled={isRunning}
          >
            Short Break
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'longBreak' ? styles.active : ''}`}
            onClick={() => handleModeChange('longBreak')}
            disabled={isRunning}
          >
            Long Break
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'custom' ? styles.active : ''}`}
            onClick={() => handleModeChange('custom')}
            disabled={isRunning}
            title="Set custom timer duration"
          >
            <Settings size={18} />
            Custom
          </button>
        </div>

        {showCustomInput && mode === 'custom' && (
          <div className={styles.customTimeInput}>
            <label htmlFor="customMinutes">Duration (minutes):</label>
            <div className={styles.inputGroup}>
              <input
                id="customMinutes"
                type="number"
                min="1"
                max="120"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isRunning}
              />
              <button
                className={styles.setBtn}
                onClick={handleCustomTimeSet}
                disabled={isRunning || customMinutes <= 0 || customMinutes > 120}
              >
                Set Timer
              </button>
            </div>
          </div>
        )}

        <div className={styles.timerDisplay}>
          <div className={styles.circleContainer}>
            <svg className={styles.progressCircle} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" className={styles.circleBg} />
              <circle
                cx="50"
                cy="50"
                r="45"
                className={styles.circleProgress}
                style={{
                  strokeDashoffset: 283 - (283 * progress) / 100,
                  stroke: getModeColor(),
                }}
              />
            </svg>
            <div className={styles.timerContent}>
              <div className={styles.modeLabel}>{getModeLabel()}</div>
              <div className={styles.timeDisplay}>{formatTime(timeLeft)}</div>
              <div className={styles.sessionInfo}>
                Session {sessionsCompleted + 1}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          <button
            className={`${styles.controlBtn} ${styles.primaryBtn}`}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? (
              <>
                <Pause size={20} />
                Pause
              </>
            ) : (
              <>
                <Play size={20} />
                Start
              </>
            )}
          </button>
          <button
            className={`${styles.controlBtn} ${styles.secondaryBtn}`}
            onClick={handleReset}
          >
            <RotateCcw size={20} />
            Reset
          </button>
          <button
            className={`${styles.controlBtn} ${styles.soundBtn}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 size={20} />
            ) : (
              <VolumeX size={20} />
            )}
          </button>
        </div>
      </div>

      <div className={styles.statsSection}>
        <div className={styles.statsCard}>
          <h3>Today's Sessions</h3>
          <p className={styles.statValue}>{sessionsCompleted}</p>
          <p className={styles.statLabel}>Completed</p>
        </div>
        <div className={styles.statsCard}>
          <h3>Duration</h3>
          <p className={styles.statValue}>
            {(sessionsCompleted * settings.pomodoroLength).toString()}
          </p>
          <p className={styles.statLabel}>Minutes</p>
        </div>
        <div className={styles.statsCard}>
          <h3>Settings</h3>
          <div className={styles.settingsInfo}>
            <p>Work: {settings.pomodoroLength}m</p>
            <p>Break: {settings.shortBreakLength}m</p>
            <p>Long: {settings.longBreakLength}m</p>
          </div>
        </div>
      </div>

      <div className={styles.historySection}>
        <h2>Session History</h2>
        <div className={styles.historyList}>
          {pomodoroSessions.length === 0 ? (
            <p className={styles.noSessions}>
              No sessions yet. Start a timer to begin!
            </p>
          ) : (
            pomodoroSessions.slice(-10).reverse().map((session, idx) => (
              <div key={`session-${idx}`} className={styles.historyItem}>
                <span className={styles.sessionNumber}>#{pomodoroSessions.length - idx}</span>
                <span className={styles.sessionDate}>
                  {new Date(session.startTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className={`${styles.sessionDuration} ${session.completed ? styles.completed : styles.incomplete}`}>
                  {Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)} min
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

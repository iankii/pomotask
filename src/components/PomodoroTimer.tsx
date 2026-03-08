import React, { useState, useEffect, useCallback, useRef } from 'react';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import useNotifications from '../hooks/useNotifications';
import { useStore } from '../store';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings } from 'lucide-react';
import styles from './PomodoroTimer.module.css';

type TimerMode = 'work' | 'shortBreak' | 'longBreak' | 'custom';

export const PomodoroTimer: React.FC = () => {
  const settings = useStore((state) => state.settings);
  const pomodoroSessions = useStore((state) => state.pomodoroSessions);
  const { setActivePomodoro, updateActivePomodoro, clearActivePomodoro } = useStore();
  const restartPomodoroFlag = useStore((state) => state.restartPomodoroFlag);
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroLength * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [prevDuration, setPrevDuration] = useState<number | null>(null);
  const [alerted, setAlerted] = useState(false);
  const [completed, setCompleted] = useState(false);
  // tracks whether we already fired sound/notification for the current completion
  const completionFiredRef = useRef(false);
  // track whether the timer was actually counting down (so we don't fire on a manual reset to 0)
  const wasRunningRef = useRef(false);
  // stable ref holding the last started duration — survives state re-renders so handleRestart is always correct
  const prevDurationRef = useRef<number>(settings.pomodoroLength * 60);
  // PiP refs
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipStreamRef = useRef<MediaStream | null>(null);
  const [isPip, setIsPip] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);

  const { notify } = useNotifications();

  // ref mirrors soundEnabled so the completion effect never reads a stale value
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  // Warm up AudioContext on first user interaction so it is never in 'suspended' state at completion
  useEffect(() => {
    const warm = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        if (!(window as any).__pomAudioCtx) {
          (window as any).__pomAudioCtx = new AudioCtx();
        }
        const ctx: AudioContext = (window as any).__pomAudioCtx;
        if (ctx.state === 'suspended') ctx.resume();
      } catch (e) { /* ignore */ }
    };
    window.addEventListener('pointerdown', warm, { once: true });
    return () => window.removeEventListener('pointerdown', warm);
  }, []);

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
    try {
      // Reuse a single AudioContext per page – creating a new one each time
      // can be blocked by browsers after the first user gesture window closes.
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      // Store on window so it survives re-renders
      if (!(window as any).__pomAudioCtx) {
        (window as any).__pomAudioCtx = new AudioCtx();
      }
      const audioContext: AudioContext = (window as any).__pomAudioCtx;

      // Resume if suspended (required after page loses focus)
      const scheduleRings = () => {
        const rings = [
          { freq: 880,  duration: 0.25, delay: 0.0 },
          { freq: 1100, duration: 0.25, delay: 0.3 },
          { freq: 880,  duration: 0.25, delay: 0.6 },
          { freq: 1320, duration: 0.35, delay: 0.9 },
        ];
        rings.forEach((ring) => {
          const osc  = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = ring.freq;
          osc.type = 'sine';
          const t = audioContext.currentTime + ring.delay;
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + ring.duration);
          osc.start(t);
          osc.stop(t + ring.duration + 0.05);
        });
      };

      if (audioContext.state === 'suspended') {
        audioContext.resume().then(scheduleRings);
      } else {
        scheduleRings();
      }
    } catch (e) {
      // AudioContext not available – silently skip
    }
  }, []);

  const triggerVibration = useCallback(() => {
    if ('vibrate' in navigator) {
      // Pattern: vibrate for 100ms, pause 50ms, vibrate for 100ms, pause 50ms, vibrate for 100ms
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  }, []);

  // ---- Picture-in-Picture helpers ----
  // Draw one frame — compact timer circle that fits neatly in the PiP window
  const drawPipFrame = useCallback((tl: number, m: typeof mode, done: boolean) => {
    const canvas = pipCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;   // 320
    const H = canvas.height;  // 240
    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0d1117');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Mode colour
    const modeColor: Record<string, string> = {
      work: '#3b82f6', shortBreak: '#10b981',
      longBreak: '#8b5cf6', custom: '#f59e0b',
    };
    const color = done ? '#10b981' : (modeColor[m] ?? '#3b82f6');

    // Progress arc — R=90 fits 400×300 canvas with room to spare
    const dur = prevDurationRef.current > 0 ? prevDurationRef.current : totalDuration;
    const progress = dur > 0 ? Math.max(0, Math.min(1, (dur - tl) / dur)) : 0;
    const cx = W / 2;
    const cy = H / 2 + 6;
    const R  = 63;
    const lw = 7;
    const startAngle = -Math.PI / 2;

    // Track ring
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = lw;
    ctx.stroke();

    // Filled arc
    if (progress > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, R, startAngle, startAngle + 2 * Math.PI * progress);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Mode label above time
    const modeLabel: Record<string, string> = {
      work: 'Focus Time', shortBreak: 'Short Break',
      longBreak: 'Long Break', custom: 'Custom',
    };
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(modeLabel[m] ?? '', cx, cy - 24);

    // Countdown
    const mins = Math.floor(tl / 60);
    const secs = tl % 60;
    ctx.fillStyle = done ? '#10b981' : '#f1f5f9';
    ctx.font = 'bold 32px Monaco, Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, cx, cy + 3);

    // Progress % / Done
    ctx.fillStyle = color;
    ctx.font = '600 9px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(done ? '✓ Done!' : `${Math.round(progress * 100)}%`, cx, cy + 26);

    // Watermark
    ctx.fillStyle = 'rgba(148,163,184,0.35)';
    ctx.font = '500 10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('PomoTask', W - 10, H - 6);
  }, [totalDuration]);

  const startPip = useCallback(async () => {
    try {
      if (!('pictureInPictureEnabled' in document)) return;

      if (!pipCanvasRef.current) {
        pipCanvasRef.current = document.createElement('canvas');
        pipCanvasRef.current.width = 320;
        pipCanvasRef.current.height = 240;
      }
      const canvas = pipCanvasRef.current;

      if (!pipVideoRef.current) {
        pipVideoRef.current = document.createElement('video');
        pipVideoRef.current.muted = true;
        pipVideoRef.current.playsInline = true;
      }
      const video = pipVideoRef.current;

      // Draw an initial frame before streaming so video isn't blank
      drawPipFrame(timeLeft, mode, completed);

      if (!pipStreamRef.current) {
        pipStreamRef.current = canvas.captureStream(4);
        video.srcObject = pipStreamRef.current;
      }

      // play() needs a user-gesture context — it will succeed here since
      // startPip is called from onChange (a click) or from isRunning effect
      if (video.paused) {
        await video.play();
      }

      if (document.pictureInPictureElement !== video) {
        await video.requestPictureInPicture();
      }
      setIsPip(true);
    } catch (e) {
      // PiP not supported or user declined — silently skip
    }
  }, [timeLeft, mode, completed, drawPipFrame]);

  const stopPip = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
    } catch (e) {
      // ignore
    }
    setIsPip(false);
  }, []);

  // Listen for the browser-native PiP close event
  useEffect(() => {
    const video = pipVideoRef.current;
    if (!video) return;
    const onLeave = () => setIsPip(false);
    video.addEventListener('leavepictureinpicture', onLeave);
    return () => video.removeEventListener('leavepictureinpicture', onLeave);
  });

  // Continuously draw to the PiP canvas while PiP is open (updates the floating window)
  useEffect(() => {
    if (!isPip) return;
    drawPipFrame(timeLeft, mode, completed);
    const id = setInterval(() => drawPipFrame(timeLeft, mode, completed), 500);
    return () => clearInterval(id);
  }, [isPip, timeLeft, mode, completed, drawPipFrame]);
  // ---- end PiP ----

  // Auto-PiP: start PiP when timer starts running & pipEnabled; stop when disabled or timer stops
  useEffect(() => {
    if (settings.pipEnabled && isRunning) {
      startPip();
    } else if (!settings.pipEnabled && isPip) {
      stopPip();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.pipEnabled, isRunning]);

  // mirror isRunning into a ref for the completion effect
  useEffect(() => { wasRunningRef.current = isRunning; }, [isRunning]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    // Update store when timer is running
    if (isRunning) {
      setActivePomodoro({
        mode,
        timeLeft,
        isRunning: true,
        startTime: Date.now(),
      });
    }
    // Note: we do NOT clear activePomodoro here when timeLeft===0 — the completion
    // effect writes completed:true into the store so the floating button can show
    // the Restart chip. clearActivePomodoro() is called only from handleReset / handleModeChange.

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTimeLeft = Math.max(0, prev - 1);
          updateActivePomodoro({ timeLeft: newTimeLeft });
          return newTimeLeft;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, setActivePomodoro, updateActivePomodoro, clearActivePomodoro]);

  // Separate effect for handling completion
  useEffect(() => {
    // Fire once: when timeLeft hits 0 while the timer was counting down and we haven't fired yet
    if (timeLeft <= 0 && wasRunningRef.current && !completionFiredRef.current) {
      completionFiredRef.current = true;

      // Play sound and vibration immediately (use ref to avoid stale closure)
      if (soundEnabledRef.current) {
        playCompletionSound();
      }
      triggerVibration();

      // Remember the duration that just finished so user can restart the same length
      const finishedDuration = prevDurationRef.current > 0 ? prevDurationRef.current : totalDuration;
      setPrevDuration(finishedDuration);
      setAlerted(true);
      setCompleted(true);
      // brief visual green pulse
      setTimeout(() => setAlerted(false), 1800);

      // Show browser notification / fallback toast
      try {
        if (typeof notify === 'function') {
          notify('Pomodoro complete! 🎉', {
            body: `${getModeLabel()} finished`,
            icon: '/favicon.svg',
            silent: true,
          });
        }
      } catch (e) {
        // notifications may be unavailable
      }

      // Stop the timer and update sessions; write completed+prevDuration into store for floating button
      const completedDuration = prevDurationRef.current > 0 ? prevDurationRef.current : totalDuration;
      const timer = setTimeout(() => {
        if (mode === 'work') {
          setSessionsCompleted((prev) => prev + 1);
        }
        setIsRunning(false);
        setTimeLeft(0);
        setActivePomodoro({
          mode,
          timeLeft: 0,
          isRunning: false,
          startTime: Date.now(),
          completed: true,
          prevDuration: completedDuration,
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [timeLeft, mode, playCompletionSound, triggerVibration, clearActivePomodoro, totalDuration, notify]);

  const handleReset = useCallback(() => {
    completionFiredRef.current = false;
    wasRunningRef.current = false;
    setIsRunning(false);
    // restore duration for the current mode (not timeLeft which is 0 after completion)
    const modeDuration = {
      work: settings.pomodoroLength * 60,
      shortBreak: settings.shortBreakLength * 60,
      longBreak: settings.longBreakLength * 60,
      custom: customMinutes * 60,
    }[mode];
    setTimeLeft(modeDuration);
    setCompleted(false);
    setPrevDuration(null);
    clearActivePomodoro();
  }, [mode, settings, customMinutes, clearActivePomodoro]);

  const handleRestart = useCallback(() => {
    // prevDurationRef is set when Start is clicked, so it always holds the correct duration
    const duration = prevDurationRef.current > 0 ? prevDurationRef.current : totalDuration;
    completionFiredRef.current = false;
    wasRunningRef.current = false;
    setTimeLeft(duration);
    setCompleted(false);
    setPrevDuration(null);
    setIsRunning(true);
  }, [totalDuration]);

  // ---- Respond to external restart trigger (from floating button) ----
  const activePomodoro = useStore((state) => state.activePomodoro);
  const restartFlagInitRef = useRef(false);
  const prevFlagRef = useRef(restartPomodoroFlag);

  // On mount: if a restart was requested while modal was closed, auto-start immediately
  useEffect(() => {
    if (restartPomodoroFlag > 0) {
      const duration = activePomodoro?.prevDuration ?? prevDurationRef.current;
      if (duration > 0) {
        prevDurationRef.current = duration;
        completionFiredRef.current = false;
        wasRunningRef.current = false;
        setTimeLeft(duration);
        setCompleted(false);
        setPrevDuration(null);
        setIsRunning(true);
      }
    }
    restartFlagInitRef.current = true;
    prevFlagRef.current = restartPomodoroFlag;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // While modal is open, respond to further flag increments
  useEffect(() => {
    if (!restartFlagInitRef.current) return; // skip the mount run (handled above)
    if (prevFlagRef.current === restartPomodoroFlag) return;
    prevFlagRef.current = restartPomodoroFlag;
    handleRestart();
  }, [restartPomodoroFlag, handleRestart]);
  // ---- end external restart ----

  const handleModeChange = (newMode: TimerMode) => {
    completionFiredRef.current = false;
    wasRunningRef.current = false;
    setMode(newMode);
    setIsRunning(false);
    setCompleted(false);
    clearActivePomodoro();
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
          <button
            className={`${styles.modeBtn}`}
            onClick={() => {
              completionFiredRef.current = false;
              wasRunningRef.current = false;
              prevDurationRef.current = 10;
              setMode('custom');
              setIsRunning(false);
              setCompleted(false);
              setShowCustomInput(false);
              setTimeLeft(10);
              setPrevDuration(10);
              clearActivePomodoro();
            }}
            disabled={isRunning}
            title="Quick 10-second test timer"
            style={{ color: '#f59e0b', borderColor: '#f59e0b' }}
          >
            10s Test
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
                style={{
                  strokeDashoffset: 283 - (283 * progress) / 100,
                  stroke: alerted ? '#10b981' : getModeColor(),
                }}
                className={`${styles.circleProgress} ${alerted ? styles.greenPulse : ''}`}
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
          {completed ? (
            // After completion: Restart re-runs the same duration; Reset goes back to mode default
            <>
              <button
                className={`${styles.controlBtn} ${styles.primaryBtn}`}
                onClick={handleRestart}
                title="Restart with the same duration"
              >
                <RotateCcw size={18} />
                Restart
              </button>
            </>
          ) : (
            // Normal running/paused state
            <>
              <button
                className={`${styles.controlBtn} ${styles.primaryBtn}`}
                onClick={() => {
                  if (isRunning) {
                    setIsRunning(false);
                  } else {
                    // capture the duration the user is about to run
                    prevDurationRef.current = timeLeft;
                    if (!prevDuration) setPrevDuration(timeLeft);
                    setIsRunning(true);
                  }
                }}
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
            </>
          )}
          <button
            className={`${styles.controlBtn} ${styles.soundBtn}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>

        {/* ---- Picture-in-Picture toggle ---- */}
        {'pictureInPictureEnabled' in document && (
          <div className={styles.pipToggleRow}>
            <Tooltip
              title="When ON, the timer floats as a mini window over all tabs while running"
              placement="top"
              arrow
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pipEnabled}
                    onChange={(_, checked) => {
                      useStore.getState().updateSettings({ pipEnabled: checked });
                      if (checked && isRunning) {
                        startPip();
                      } else if (!checked) {
                        stopPip();
                      }
                    }}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b5cf6' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#7c3aed' },
                    }}
                  />
                }
                label={
                  <span className={styles.pipToggleLabel}>
                    🖥️ Float timer outside tab
                    {isPip && <span className={styles.pipLiveBadge}>● LIVE</span>}
                  </span>
                }
                labelPlacement="start"
                sx={{ color: '#94a3b8', fontSize: '0.85rem', gap: '4px', margin: 0 }}
              />
            </Tooltip>
          </div>
        )}
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

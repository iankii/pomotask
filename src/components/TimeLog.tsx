import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Clock, Calendar } from 'lucide-react';
import styles from './TimeLog.module.css';

export const TimeLog: React.FC = () => {
  const [newEntryDate, setNewEntryDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newEntryDescription, setNewEntryDescription] = useState('');
  const [newEntryDuration, setNewEntryDuration] = useState('');
  const timeEntries = useStore((state) => state.timeEntries);
  const addTimeEntry = useStore((state) => state.addTimeEntry);
  const deleteTimeEntry = useStore((state) => state.deleteTimeEntry);

  const handleAddEntry = () => {
    if (newEntryDescription.trim() && newEntryDuration) {
      addTimeEntry({
        date: newEntryDate,
        activityType: 'other',
        title: newEntryDescription,
        description: newEntryDescription,
        timeBlocks: [],
        duration: parseFloat(newEntryDuration),
      });
      setNewEntryDescription('');
      setNewEntryDuration('');
    }
  };

  const getTimeEntriesByDate = () => {
    const grouped: Record<string, typeof timeEntries> = {};
    timeEntries.forEach((entry) => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = [];
      }
      grouped[entry.date].push(entry);
    });
    return Object.entries(grouped).sort(([dateA], [dateB]) =>
      dateB.localeCompare(dateA)
    );
  };

  const getTotalHours = () => {
    return timeEntries.reduce((acc, entry) => acc + entry.duration, 0).toFixed(1);
  };

  const getTodayHours = () => {
    const today = new Date().toISOString().split('T')[0];
    return timeEntries
      .filter((entry) => entry.date === today)
      .reduce((acc, entry) => acc + entry.duration, 0)
      .toFixed(1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getDayTotal = (entries: typeof timeEntries) => {
    return entries.reduce((acc, entry) => acc + entry.duration, 0).toFixed(1);
  };

  const timeEntriesByDate = getTimeEntriesByDate();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Time Tracking</h1>
        <p>Log and track your time spent on tasks</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Clock size={24} />
          <div>
            <p className={styles.statLabel}>Today</p>
            <p className={styles.statValue}>{getTodayHours()}h</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <Calendar size={24} />
          <div>
            <p className={styles.statLabel}>Total</p>
            <p className={styles.statValue}>{getTotalHours()}h</p>
          </div>
        </div>
      </div>

      <div className={styles.addEntrySection}>
        <h2>Add Time Entry</h2>
        <div className={styles.addForm}>
          <input
            type="date"
            value={newEntryDate}
            onChange={(e) => setNewEntryDate(e.target.value)}
            className={styles.dateInput}
          />
          <input
            type="text"
            placeholder="What did you work on?"
            value={newEntryDescription}
            onChange={(e) => setNewEntryDescription(e.target.value)}
            className={styles.descriptionInput}
          />
          <input
            type="number"
            placeholder="Hours"
            step="0.5"
            min="0"
            value={newEntryDuration}
            onChange={(e) => setNewEntryDuration(e.target.value)}
            className={styles.durationInput}
          />
          <button onClick={handleAddEntry} className={styles.addBtn}>
            <Plus size={20} />
            Log Time
          </button>
        </div>
      </div>

      <div className={styles.entriesList}>
        <h2>Time Entries</h2>
        {timeEntriesByDate.length === 0 ? (
          <div className={styles.emptyState}>
            <Clock size={48} />
            <p>No time entries yet. Start tracking your time!</p>
          </div>
        ) : (
          timeEntriesByDate.map(([date, entries]) => (
            <div key={date} className={styles.dateGroup}>
              <div className={styles.dateHeader}>
                <span className={styles.dateLabel}>{formatDate(date)}</span>
                <span className={styles.dayTotal}>{getDayTotal(entries)}h</span>
              </div>
              <div className={styles.entriesGroup}>
                {entries.map((entry) => (
                  <div key={entry.id} className={styles.entryItem}>
                    <div className={styles.entryContent}>
                      <p className={styles.entryDescription}>
                        {entry.description}
                      </p>
                      <div className={styles.entryMeta}>
                        {entry.timeBlocks.length > 0 && (
                          <span className={styles.metaBadge}>
                            {entry.timeBlocks.length} blocks
                          </span>
                        )}
                        <span className={styles.metaBadge}>
                          {entry.duration}h
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTimeEntry(entry.id)}
                      className={styles.deleteBtn}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {timeEntries.length > 0 && (
        <div className={styles.summaryCard}>
          <h3>Weekly Summary</h3>
          <div className={styles.weeklySummary}>
            <div className={styles.weeklyItem}>
              <span>Total Hours Logged</span>
              <span className={styles.totalValue}>{getTotalHours()}h</span>
            </div>
            <div className={styles.weeklyItem}>
              <span>Average Per Day</span>
              <span className={styles.totalValue}>
                {(
                  timeEntries.reduce((acc, entry) => acc + entry.duration, 0) /
                  new Set(timeEntries.map((e) => e.date)).size
                ).toFixed(1)}
                h
              </span>
            </div>
            <div className={styles.weeklyItem}>
              <span>Total Entries</span>
              <span className={styles.totalValue}>{timeEntries.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

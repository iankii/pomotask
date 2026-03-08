import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { Download, Upload, Trash2, Copy, Check } from 'lucide-react';
import styles from './DataManager.module.css';

export const DataManager: React.FC = () => {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const store = useStore();

  const getStoreData = () => {
    return {
      tasks: store.tasks,
      archivedTasks: store.archivedTasks,
      lists: store.lists,
      labels: store.labels,
      teamMembers: store.teamMembers,
      teamTasks: store.teamTasks,
      archivedTeamTasks: store.archivedTeamTasks,
      timeEntries: store.timeEntries,
      pomodoroSessions: store.pomodoroSessions,
      settings: store.settings,
      exportDate: new Date().toISOString(),
    };
  };

  const exportAsJSON = () => {
    const data = getStoreData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadFile(blob, `task-app-export-${new Date().toISOString().split('T')[0]}.json`);
  };

  const exportAsCSV = () => {
    const data = getStoreData();
    let csv = 'Task Export\n\n';
    
    // Tasks
    csv += 'TASKS\n';
    csv += 'ID,Title,Description,Priority,Status,DueDate,Sprint\n';
    data.tasks.forEach((task) => {
      const row = [
        task.id,
        `"${task.title}"`,
        `"${task.description || ''}"`,
        task.priority,
        task.completed ? 'Done' : 'Pending',
        task.dueDate || '',
        task.sprint || 'none',
      ];
      csv += row.join(',') + '\n';
    });

    csv += '\n\nTEAM TASKS\n';
    csv += 'ID,Title,Description,Status,AssignedTo\n';
    data.teamTasks.forEach((teamTask) => {
      const row = [
        teamTask.id,
        `"${teamTask.title}"`,
        `"${teamTask.description || ''}"`,
        teamTask.status,
        teamTask.assignedTo,
      ];
      csv += row.join(',') + '\n';
    });

    csv += '\n\nTIME ENTRIES\n';
    csv += 'Date,Title,Description,ActivityType,Duration(hours)\n';
    data.timeEntries.forEach((entry) => {
      const row = [entry.date, `"${entry.title}"`, `"${entry.description || ''}"`, entry.activityType, entry.duration];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `task-app-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportClick = () => {
    if (exportFormat === 'json') {
      exportAsJSON();
    } else {
      exportAsCSV();
    }
  };

  const handleCopyJSON = () => {
    const data = getStoreData();
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        // Update store with imported data
        if (data.tasks && Array.isArray(data.tasks)) {
          data.tasks.forEach((task: any) => store.addTask(task));
        }
        
        alert('Data imported successfully!');
      } catch (err) {
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (showConfirmDelete) {
      // Clear all data
      store.tasks.forEach((task) => store.deleteTask(task.id));
      store.teamMembers.forEach((member) => store.deleteTeamMember(member.id));
      store.timeEntries.forEach((entry) => store.deleteTimeEntry(entry.id));
      setShowConfirmDelete(false);
      alert('All data cleared successfully!');
    }
  };

  const stats = {
    totalTasks: store.tasks.length + store.archivedTasks.length,
    activeTasks: store.tasks.length,
    archivedTasks: store.archivedTasks.length,
    teamMembers: store.teamMembers.length,
    timeEntries: store.timeEntries.length,
    pomodoroSessions: store.pomodoroSessions.length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Data Manager</h1>
        <p>Export, import, and manage your application data</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span>📌</span>
          <div>
            <p className={styles.statLabel}>Total Tasks</p>
            <p className={styles.statValue}>{stats.totalTasks}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <span>👤</span>
          <div>
            <p className={styles.statLabel}>Team Members</p>
            <p className={styles.statValue}>{stats.teamMembers}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <span>⏱️</span>
          <div>
            <p className={styles.statLabel}>Time Entries</p>
            <p className={styles.statValue}>{stats.timeEntries}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <span>🍅</span>
          <div>
            <p className={styles.statLabel}>Pomodoro Sessions</p>
            <p className={styles.statValue}>{stats.pomodoroSessions}</p>
          </div>
        </div>
      </div>

      <div className={styles.actionsGrid}>
        <div className={styles.actionCard}>
          <div className={styles.actionHeader}>
            <Download size={24} />
            <h2>Export Data</h2>
          </div>
          <p>Download your data in JSON or CSV format for backup or analysis.</p>
          
          <div className={styles.formatSelector}>
            <label>
              <input
                type="radio"
                checked={exportFormat === 'json'}
                onChange={() => setExportFormat('json')}
              />
              JSON Format
            </label>
            <label>
              <input
                type="radio"
                checked={exportFormat === 'csv'}
                onChange={() => setExportFormat('csv')}
              />
              CSV Format
            </label>
          </div>

          <div className={styles.actionButtons}>
            <button onClick={handleExportClick} className={styles.primaryBtn}>
              <Download size={18} />
              Download {exportFormat.toUpperCase()}
            </button>
            {exportFormat === 'json' && (
              <button onClick={handleCopyJSON} className={styles.secondaryBtn}>
                {copiedToClipboard ? (
                  <>
                    <Check size={18} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy JSON
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className={styles.actionCard}>
          <div className={styles.actionHeader}>
            <Upload size={24} />
            <h2>Import Data</h2>
          </div>
          <p>Upload a JSON file to import data and restore your workspace.</p>
          
          <div className={styles.uploadArea}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className={styles.fileInput}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={styles.primaryBtn}
            >
              <Upload size={18} />
              Choose JSON File
            </button>
          </div>
        </div>

        <div className={styles.actionCard}>
          <div className={styles.actionHeader}>
            <Trash2 size={24} style={{ color: '#ef4444' }} />
            <h2>Clear All Data</h2>
          </div>
          <p>Permanently delete all data. This action cannot be undone.</p>
          
          <div className={styles.warningBox}>
            <p>⚠️ This will delete all tasks, team members, time entries, and settings.</p>
          </div>

          {showConfirmDelete ? (
            <div className={styles.confirmDelete}>
              <p>Are you sure? This cannot be undone.</p>
              <div className={styles.confirmButtons}>
                <button
                  onClick={handleClearData}
                  className={styles.dangerBtn}
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className={styles.dangerBtn}
            >
              <Trash2 size={18} />
              Clear All Data
            </button>
          )}
        </div>
      </div>

      <div className={styles.infoCard}>
        <h3>Data Format Information</h3>
        <div className={styles.infoContent}>
          <div className={styles.infoItem}>
            <h4>JSON Format</h4>
            <p>Complete backup of all application data. Recommended for full backups and migrations.</p>
          </div>
          <div className={styles.infoItem}>
            <h4>CSV Format</h4>
            <p>Spreadsheet-compatible format for tasks and entries. Good for analysis and reporting.</p>
          </div>
          <div className={styles.infoItem}>
            <h4>Auto-Save</h4>
            <p>Your data is automatically saved to browser storage every second. Manual backups recommended monthly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

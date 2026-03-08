import React, { useState } from 'react';
import { X, Eye, Edit2, Trash2, Flag, CheckCircle2 } from 'lucide-react';
import { Switch, styled } from '@mui/material';
import { useStore } from '../store';
import { SegmentedControl } from './SegmentedControl';
import type { Task } from '../types';
import styles from './TaskDetailModal.module.css';

const CustomSwitch = styled(Switch)(() => ({
  width: 50,
  height: 28,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(22px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#ff6b6b',
        opacity: 1,
        border: 0,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    color: '#707070',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    width: 24,
    height: 24,
  },
  '& .MuiSwitch-track': {
    borderRadius: 14,
    backgroundColor: '#3a3a3a',
    opacity: 1,
    transition: 'background-color 0.3s ease',
    border: 0,
  },
}));

interface TaskDetailModalProps {
  task: Task;
  mode: 'view' | 'edit';
  onModeChange: (mode: 'view' | 'edit') => void;
  onClose: () => void;
  onTaskUpdate?: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  mode,
  onModeChange,
  onClose,
  onTaskUpdate,
}) => {
  const { updateTask, deleteTask, labels, teamMembers, currentUserId } = useStore();
  const [formData, setFormData] = useState(task);

  const handleSave = () => {
    updateTask(task.id, formData);
    onTaskUpdate?.(formData);
    onModeChange('view');
  };

  const handleDelete = () => {
    if (confirm('Delete this task? This action cannot be undone.')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const taskLabels = formData.labels.map((id) => labels.find((l) => l.id === id)).filter(Boolean);

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{mode === 'view' ? 'Task Details' : 'Edit Task'}</h2>
          <div className={styles.headerActions}>
            <button
              className={styles.modeToggle}
              onClick={() => onModeChange(mode === 'view' ? 'edit' : 'view')}
              title={mode === 'view' ? 'Edit mode' : 'View mode'}
            >
              {mode === 'view' ? <Edit2 size={18} /> : <Eye size={18} />}
            </button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {mode === 'view' ? (
            <>
              <div className={styles.statusBadge}>
                {formData.completed ? (
                  <>
                    <CheckCircle2 size={16} /> Completed
                  </>
                ) : (
                  <>
                    <Flag size={16} /> Active
                  </>
                )}
              </div>

              <h3 className={styles.largeTitle}>{formData.title}</h3>

              {formData.description && (
                <div className={styles.description}>{formData.description}</div>
              )}

              <div className={styles.metadataGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Priority</span>
                  <span
                    className={styles.badge}
                    style={{
                      backgroundColor: {
                        urgent: '#ef4444',
                        high: '#f97316',
                        medium: '#f59e0b',
                        low: '#10b981',
                      }[formData.priority] + '20',
                      color: {
                        urgent: '#ef4444',
                        high: '#f97316',
                        medium: '#f59e0b',
                        low: '#10b981',
                      }[formData.priority],
                    }}
                  >
                    {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                  </span>
                </div>

                {formData.dueDate && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Due Date</span>
                    <span className={styles.metaValue}>
                      {new Date(formData.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Sprint</span>
                  <span className={styles.metaValue}>
                    {formData.sprint.charAt(0).toUpperCase() + formData.sprint.slice(1)}
                  </span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Pomodoros</span>
                  <span className={styles.metaValue}>
                    {formData.pomodoroCount} / {formData.estimatedPomodoros}
                  </span>
                </div>

                {formData.assignedTo && (
                  <>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Assigned To</span>
                      <span className={styles.metaValue}>
                        {teamMembers.find((m) => m.id === formData.assignedTo)?.name || 'Unknown'}
                      </span>
                    </div>

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Needs My Input</span>
                      <button
                        onClick={() => {
                          const updated = { ...formData, needsMyInput: !formData.needsMyInput };
                          setFormData(updated);
                          updateTask(task.id, updated);
                        }}
                        className={`${styles.needsInputBadge} ${formData.needsMyInput ? styles.active : ''}`}
                      >
                        {formData.needsMyInput ? '⚠️ Yes' : '◯ No'}
                      </button>
                    </div>
                  </>
                )}

                {taskLabels.length > 0 && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Labels</span>
                    <div className={styles.labelsList}>
                      {taskLabels.map((label) => (
                        <span
                          key={label?.id}
                          className={styles.label}
                          style={{ backgroundColor: label?.color + '20', color: label?.color }}
                        >
                          {label?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <form className={styles.editForm}>
              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as any,
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dueDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Estimated Pomodoros</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.estimatedPomodoros}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedPomodoros: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Sprint</label>
                  <SegmentedControl
                    options={[
                      { label: 'None', value: 'none' },
                      { label: 'Current', value: 'current' },
                      { label: 'Future', value: 'future' },
                    ]}
                    value={formData.sprint}
                    onChange={(sprint: string) =>
                      setFormData({ ...formData, sprint: sprint as any })
                    }
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Assign To</label>
                  <select
                    value={formData.assignedTo || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignedTo: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">Unassigned</option>
                    {currentUserId && (
                      <option value={currentUserId}>
                        Me ({teamMembers.find((m) => m.id === currentUserId)?.name})
                      </option>
                    )}
                    {teamMembers
                      .filter((member) => member.id !== currentUserId)
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                  </select>
                </div>

                {formData.assignedTo && (
                  <div className={styles.formGroup}>
                    <label>Needs My Input</label>
                    <div className={styles.switchContainer}>
                      <CustomSwitch
                        checked={formData.needsMyInput || false}
                        onChange={(_, checked) =>
                          setFormData({
                            ...formData,
                            needsMyInput: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.deleteBtn}
            onClick={handleDelete}
            title="Delete task"
          >
            <Trash2 size={16} /> Delete
          </button>

          <div className={styles.footerActions}>
            {mode === 'edit' && (
              <>
                <button className={styles.cancelBtn} onClick={() => onModeChange('view')}>
                  Cancel
                </button>
                <button className={styles.saveBtn} onClick={handleSave}>
                  Save
                </button>
              </>
            )}
            {mode === 'view' && (
              <button className={styles.closeModalBtn} onClick={onClose}>
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

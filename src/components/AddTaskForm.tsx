import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../store';
import styles from './AddTaskForm.module.css';

interface AddTaskFormProps {
  listId: string;
  matrixQuadrant?: 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'not-urgent-not-important';
  onClose: () => void;
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({ listId, matrixQuadrant, onClose }) => {
  const { addTask } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title,
      description,
      listId,
      priority,
      labels: [],
      dueDate: dueDate || undefined,
      sprint: 'none',
      completed: false,
      estimatedPomodoros,
      ...(matrixQuadrant && { matrixQuadrant }),
    });

    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setEstimatedPomodoros(1);
    onClose();
  };

  return (
    <div className={styles.form}>
      <div className={styles.header}>
        <h3>Add Task</h3>
        <button onClick={onClose} className={styles.closeBtn}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.content}>
        <input
          type="text"
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={styles.titleInput}
          autoFocus
          required
        />

        <textarea
          placeholder="Description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.descriptionInput}
          rows={3}
        />

        <div className={styles.row}>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className={styles.select}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={styles.dateInput}
          />

          <input
            type="number"
            min="1"
            max="20"
            value={estimatedPomodoros}
            onChange={(e) => setEstimatedPomodoros(parseInt(e.target.value) || 1)}
            placeholder="Pomodoros"
            className={styles.numberInput}
          />
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" className={styles.addBtn}>
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
};

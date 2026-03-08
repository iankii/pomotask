import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../store';
import { AddTaskForm } from './AddTaskForm';
import styles from './TodayView.module.css';

export const TodayView: React.FC = () => {
  const { tasks } = useStore();
  const today = new Date().toISOString().split('T')[0];
  const [addingToSection, setAddingToSection] = useState<string | null>(null);

  // Only show tasks from board columns (listIds 2, 3, 4), not from To Do (list 1) or matrix tasks
  const boardTasks = tasks.filter((t) => ['2', '3', '4'].includes(t.listId));

  const todayTasks = boardTasks.filter(
    (t) => t.dueDate === today && !t.completed
  );

  const overdueTasks = boardTasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date(today);
  });

  const completedToday = boardTasks.filter(
    (t) => t.dueDate === today && t.completed
  );

  return (
    <div className={styles.todayView}>
      <div className={styles.section}>
        <h2>Overdue ({overdueTasks.length})</h2>
        <div className={styles.taskList}>
          {overdueTasks.map((task) => (
            <div key={task.id} className={styles.taskItem}>
              <span>{task.title}</span>
            </div>
          ))}
          {overdueTasks.length === 0 && <p>No overdue tasks</p>}
        </div>
        <button
          className={styles.addBtn}
          onClick={() => setAddingToSection('overdue')}
        >
          <Plus size={18} /> Add Task
        </button>
        {addingToSection === 'overdue' && (
          <AddTaskForm
            listId="2"
            onClose={() => setAddingToSection(null)}
          />
        )}
      </div>

      <div className={styles.section}>
        <h2>Today ({todayTasks.length})</h2>
        <div className={styles.taskList}>
          {todayTasks.map((task) => (
            <div key={task.id} className={styles.taskItem}>
              <span>{task.title}</span>
            </div>
          ))}
          {todayTasks.length === 0 && <p>No tasks for today</p>}
        </div>
        <button
          className={styles.addBtn}
          onClick={() => setAddingToSection('today')}
        >
          <Plus size={18} /> Add Task
        </button>
        {addingToSection === 'today' && (
          <AddTaskForm
            listId="2"
            onClose={() => setAddingToSection(null)}
          />
        )}
      </div>

      <div className={styles.section}>
        <h2>Completed Today ({completedToday.length})</h2>
        <div className={styles.taskList}>
          {completedToday.map((task) => (
            <div key={task.id} className={`${styles.taskItem} ${styles.completed}`}>
              <span>{task.title}</span>
            </div>
          ))}
          {completedToday.length === 0 && <p>No completed tasks</p>}
        </div>
        <button
          className={styles.addBtn}
          onClick={() => setAddingToSection('completed')}
        >
          <Plus size={18} /> Add Task
        </button>
        {addingToSection === 'completed' && (
          <AddTaskForm
            listId="2"
            onClose={() => setAddingToSection(null)}
          />
        )}
      </div>
    </div>
  );
};

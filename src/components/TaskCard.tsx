import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, Edit2, Trash2, Calendar, Tag, Zap, User } from 'lucide-react';
import { Chip, Avatar, Typography } from '@mui/material';
import { useStore } from '../store';
import type { Task } from '../types';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  onViewModal: (task: Task) => void;
  onEditModal: (task: Task) => void;
}

const priorityColors: Record<string, string> = {
  urgent: '#ff3838',
  high: '#ff6b6b',
  medium: '#ffa500',
  low: '#4ade80',
};

const getDueDateStatus = (dueDate?: string): { label: string; color: string } | null => {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Overdue', color: '#ef4444' };
  if (diffDays === 0) return { label: 'Today', color: '#f59e0b' };
  if (diffDays === 1) return { label: 'Tomorrow', color: '#fbbf24' };
  if (diffDays <= 7) return { label: 'Soon', color: '#06b6d4' };
  return { label: 'Future', color: '#94a3b8' };
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onViewModal, onEditModal }) => {
  const [showActions, setShowActions] = useState(false);
  const sortable = useSortable({ id: task.id });
  const { attributes, setNodeRef, transform, transition, isDragging } = sortable;
  // listeners includes an onPointerDown handler from dnd-kit; we'll reference it directly
  const sensorPointerDown = (sortable.listeners as any)?.onPointerDown;
  const { deleteTask, labels, teamMembers } = useStore();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = () => {
    if (confirm('Delete this task? This action cannot be undone.')) {
      deleteTask(task.id);
    }
  };

  // completion toggle handled elsewhere; removed from card to avoid DnD conflicts

  const dueDateStatus = getDueDateStatus(task.dueDate);
  const taskLabels = task.labels.map((id) => labels.find((l) => l.id === id)).filter(Boolean);
  const priorityLabel = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : '';

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      onPointerDown={(e) => {
        // Prevent starting a drag when the user is interacting with an inner control,
        // but allow dragging when the pointer is on the drag handle (data-drag-handle).
        const target = e.target as HTMLElement | null;
        if (target && target.closest('button, a, input, textarea, select')) {
          // if this interactive element is the drag handle (or inside it), allow the drag
          if (target.closest('[data-drag-handle]')) {
            if (typeof sensorPointerDown === 'function') sensorPointerDown(e);
            return;
          }
          e.stopPropagation();
          return;
        }
        // call the original dnd-kit pointer handler to start drag if present
        if (typeof sensorPointerDown === 'function') sensorPointerDown(e);
      }}
      style={{
        ...style,
        borderLeftColor: priorityColors[task.priority],
      }}
      className={`${styles.card} ${task.completed ? styles.completed : ''} ${
        dueDateStatus?.label === 'Overdue' || dueDateStatus?.label === 'Today'
          ? styles.urgent
          : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={styles.header}>
        <button
          className={styles.dragHandle}
          aria-label="Drag handle"
          data-drag-handle
          {...(sortable.listeners || {})}
        >
          <GripVertical size={16} />
        </button>

        {/* completion toggle removed to avoid conflict with drag-and-drop */}

        <h3 className={`${styles.title} truncate`}>{task.title}</h3>

        {task.priority && (
          <Chip
            label={priorityLabel}
            size="small"
            sx={{
              backgroundColor: priorityColors[task.priority] + '20',
              color: priorityColors[task.priority],
              fontWeight: 700,
              marginLeft: 0.5,
            }}
          />
        )}

        {showActions && (
          <div className={styles.actions}>
            <button
              className={styles.actionBtn}
              onClick={() => onViewModal(task)}
              title="View"
              aria-label="View task"
            >
              <Eye size={16} />
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => onEditModal(task)}
              title="Edit"
              aria-label="Edit task"
            >
              <Edit2 size={16} />
            </button>
            <button
              className={`${styles.actionBtn} ${styles.delete}`}
              onClick={handleDelete}
              title="Delete"
              aria-label="Delete task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {task.description && <p className={`${styles.description} line-clamp-2`}>{task.description}</p>}

        {taskLabels.length > 0 && (
        <div className={styles.labels}>
          {taskLabels.map((label) => (
            <Chip
              key={label?.id}
              label={label?.name}
              size="small"
              sx={{
                backgroundColor: label?.color + '20',
                color: label?.color,
                fontWeight: 600,
                borderRadius: '6px',
              }}
            />
          ))}
        </div>
      )}

      <div className={styles.footer}>
        {task.assignedTo && (() => {
          const member = teamMembers.find((m) => m.id === task.assignedTo);
          if (!member) return null;
          return (
            <div className={styles.assigned} title={member.name}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: member.avatarColor }}>
                <User size={16} />
              </Avatar>
              <Typography className={styles.assignedName} sx={{ fontSize: '0.85rem', marginLeft: 0.5 }}>
                {member.name}
              </Typography>
            </div>
          );
        })()}
        <button
          className={styles.sprintBadge}
          onClick={() => {
            const { updateTask } = useStore.getState();
            const next =
              task.sprint === 'none' ? 'current' : task.sprint === 'current' ? 'future' : 'none';
            updateTask(task.id, { sprint: next as any });
          }}
          title="Cycle sprint"
        >
          <Tag size={12} />
          {task.sprint === 'none' ? 'None' : task.sprint === 'current' ? 'Current' : 'Future'}
        </button>

        {dueDateStatus && (
          <span className={styles.dueDate} style={{ backgroundColor: dueDateStatus.color + '20', color: dueDateStatus.color }}>
            <Calendar size={12} />
            {dueDateStatus.label}
          </span>
        )}

        <span className={styles.pomodoros}>
          <Zap size={12} />
          {task.pomodoroCount}/{task.estimatedPomodoros}
        </span>
      </div>
    </div>
  );
};

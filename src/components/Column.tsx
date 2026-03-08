import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus, ChevronDown } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';
import type { Task, List } from '../types';
import styles from './Column.module.css';

interface ColumnProps {
  list: List;
  tasks: Task[];
  onViewModal: (task: Task) => void;
  onEditModal: (task: Task) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Column: React.FC<ColumnProps> = ({
  list,
  tasks,
  onViewModal,
  onEditModal,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [addingTask, setAddingTask] = useState(false);
  const { setNodeRef } = useDroppable({ id: list.id });
  const taskIds = tasks.map((t) => t.id);

  return (
    <div className={styles.column} ref={setNodeRef}>
      <div className={styles.header} style={{ borderTopColor: list.color }}>
        {onToggleCollapse && (
          <button
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown size={20} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }} />
          </button>
        )}
        <h2 className={styles.title}>{list.title}</h2>
        <span className={styles.badge}>{tasks.length}</span>
      </div>

      {!isCollapsed && (
        <>
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div className={styles.taskList}>
              {tasks.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Drop tasks here</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onViewModal={onViewModal}
                    onEditModal={onEditModal}
                  />
                ))
              )}
            </div>
          </SortableContext>

          <button 
            className={styles.addButton} 
            onClick={() => setAddingTask(true)} 
            title="Add task"
          >
            <Plus size={18} /> Add Task
          </button>

          {addingTask && (
            <AddTaskForm
              listId={list.id}
              onClose={() => setAddingTask(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

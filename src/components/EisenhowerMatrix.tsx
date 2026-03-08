import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ChevronDown, Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { AddTaskForm } from './AddTaskForm';
import type { Task } from '../types';
import styles from './EisenhowerMatrix.module.css';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onViewModal: (task: Task) => void;
  onEditModal: (task: Task) => void;
}

type Quadrant = 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'not-urgent-not-important';

const quadrantConfig: Record<Quadrant, { label: string; color: string; icon: string }> = {
  'urgent-important': { label: 'Do First', color: '#ef4444', icon: '🔴' },
  'important-not-urgent': { label: 'Schedule', color: '#3b82f6', icon: '🔵' },
  'urgent-not-important': { label: 'Delegate', color: '#f97316', icon: '🟠' },
  'not-urgent-not-important': { label: 'Eliminate', color: '#94a3b8', icon: '⚪' },
};

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  onViewModal,
  onEditModal,
}) => {
  // All sections collapsed by default
  const [collapsedSections, setCollapsedSections] = useState<Set<Quadrant>>(
    new Set(['urgent-important', 'important-not-urgent', 'urgent-not-important', 'not-urgent-not-important'])
  );
  const [addingToQuadrant, setAddingToQuadrant] = useState<Quadrant | null>(null);

  const quadrants: Quadrant[] = [
    'urgent-important',
    'important-not-urgent',
    'urgent-not-important',
    'not-urgent-not-important',
  ];

  const getQuadrantTasks = (quadrant: Quadrant) => {
    return tasks.filter((t) => t.matrixQuadrant === quadrant);
  };

  const toggleCollapse = (quadrant: Quadrant) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(quadrant)) {
      newCollapsed.delete(quadrant);
    } else {
      newCollapsed.add(quadrant);
    }
    setCollapsedSections(newCollapsed);
  };

  return (
    <div className={styles.matrix}>
      {quadrants.map((quadrant) => {
        const { label, color, icon } = quadrantConfig[quadrant];
        const quadrantTasks = getQuadrantTasks(quadrant);
        const { setNodeRef } = useDroppable({ id: quadrant });
        const isCollapsed = collapsedSections.has(quadrant);

        return (
          <div
            key={quadrant}
            ref={setNodeRef}
            className={styles.quadrant}
          >
            <button
              className={styles.quadrantHeader}
              style={{ backgroundColor: color + '15' }}
              onClick={() => toggleCollapse(quadrant)}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <ChevronDown 
                size={18} 
                style={{ 
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)',
                  transition: 'transform 0.2s ease',
                }} 
              />
              <span className={styles.icon}>{icon}</span>
              <h3 className={styles.quadrantTitle}>{label}</h3>
              <span className={styles.quadrantCount}>{quadrantTasks.length}</span>
            </button>
            {!isCollapsed && (
              <>
                <div className={styles.quadrantTasks}>
                  {quadrantTasks.length === 0 ? (
                    <p className={styles.empty}>No tasks</p>
                  ) : (
                    quadrantTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onViewModal={onViewModal}
                        onEditModal={onEditModal}
                      />
                    ))
                  )}
                </div>
                <button
                  className={styles.addBtn}
                  onClick={() => setAddingToQuadrant(quadrant)}
                >
                  <Plus size={16} /> Add Task
                </button>
                {addingToQuadrant === quadrant && (
                  <AddTaskForm
                    listId="1"
                    matrixQuadrant={quadrant}
                    onClose={() => setAddingToQuadrant(null)}
                  />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

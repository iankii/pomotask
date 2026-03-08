import React, { useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ChevronDown, AlertCircle, Flag, User } from 'lucide-react';
import { Switch, styled } from '@mui/material';
import { useStore } from '../store';
import { Column } from './Column';
import { EisenhowerMatrix } from './EisenhowerMatrix';
import { TaskDetailModal } from './TaskDetailModal';
import { AddTaskForm } from './AddTaskForm';
import type { Task } from '../types';
import styles from './Board.module.css';

const CustomSwitch = styled(Switch)(() => ({
  width: 64,
  height: 36,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 4,
    '&.Mui-checked': {
      transform: 'translateX(28px)',
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
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    width: 28,
    height: 28,
  },
  '& .MuiSwitch-track': {
    borderRadius: 18,
    backgroundColor: '#3a3a3a',
    opacity: 1,
    transition: 'background-color 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    border: 0,
  },
}));

export const Board: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('edit');
  const [showModal, setShowModal] = useState(false);
  const [showCurrentSprintOnly, setShowCurrentSprintOnly] = useState(false);
  const [showNeedsAttention, setShowNeedsAttention] = useState(false);
  const [showAssignedToMe, setShowAssignedToMe] = useState(false);
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const { tasks, lists, moveTask, currentUserId } = useStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { distance: 8 } as any)
  );

  const filteredTasks = tasks.filter((task) => {
    const sprintMatch = showCurrentSprintOnly ? task.sprint === 'current' : true;
    const needsAttentionMatch = !showNeedsAttention || task.needsMyInput;
    const assignedToMeMatch = !showAssignedToMe || task.assignedTo === currentUserId;
    return sprintMatch && needsAttentionMatch && assignedToMeMatch;
  });

  const getTasksForList = (listId: string) => {
    if (listId === '1') {
      return filteredTasks.filter((t) => t.listId === '1' && !t.matrixQuadrant);
    }
    return filteredTasks.filter((t) => t.listId === listId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId !== overId) {
      // Check if dropping on a list (column)
      const overList = lists.find((l) => l.id === overId);
      if (overList) {
        moveTask(activeId, overId);
        return;
      }

      // Check if dropping on a matrix quadrant
      const quadrants = [
        'urgent-important',
        'important-not-urgent',
        'urgent-not-important',
        'not-urgent-not-important',
      ];
      if (quadrants.includes(overId as any)) {
        const task = tasks.find((t) => t.id === activeId);
        if (task) {
          useStore.getState().updateTask(activeId, {
            listId: '1',
            matrixQuadrant: overId as any,
          });
        }
        return;
      }
    }
  };

  const handleViewModal = (task: Task) => {
    setSelectedTask(task);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEditModal = (task: Task) => {
    setSelectedTask(task);
    setModalMode('edit');
    setShowModal(true);
  };

  const toggleCollapsible = (listId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(listId)) {
      newCollapsed.delete(listId);
    } else {
      newCollapsed.add(listId);
    }
    setCollapsedSections(newCollapsed);
  };

  return (
    <div className={styles.boardContainer}>
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <div 
            className={styles.filterToggle}
            onClick={() => setShowCurrentSprintOnly(!showCurrentSprintOnly)}
          >
            <Flag size={18} />
            <span>Current Sprint Only</span>
            <CustomSwitch
              checked={showCurrentSprintOnly}
              onChange={(_, checked) => setShowCurrentSprintOnly(checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className={styles.filterDivider} />

        <div 
          className={styles.filterToggle}
          onClick={() => setShowNeedsAttention(!showNeedsAttention)}
        >
          <AlertCircle size={18} />
          <span>Needs My Attention</span>
          <CustomSwitch
            checked={showNeedsAttention}
            onChange={(_, checked) => setShowNeedsAttention(checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div className={styles.filterDivider} />

        <div 
          className={styles.filterToggle}
          onClick={() => setShowAssignedToMe(!showAssignedToMe)}
        >
          <User size={18} />
          <span>Assigned to Me</span>
          <CustomSwitch
            checked={showAssignedToMe}
            onChange={(_, checked) => setShowAssignedToMe(checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={(event) => setActiveId(event.active.id as string)}
      >
        <div className={styles.board}>
          {lists.map((list) => {
            if (list.id === '1') {
              // To Do column with Eisenhower Matrix
              const isCollapsed = collapsedSections.has(list.id);
              return (
                <div key={list.id} className={styles.toDoColumn}>
                  <div className={styles.columnHeader} style={{ borderTopColor: list.color }}>
                    <button
                      className={styles.collapseBtn}
                      onClick={() => toggleCollapsible(list.id)}
                      title={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      <ChevronDown size={20} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }} />
                    </button>
                    <h2 className={styles.columnTitle}>{list.title}</h2>
                    <span className={styles.countBadge}>{getTasksForList(list.id).length}</span>
                  </div>
                  {!isCollapsed && (
                    <EisenhowerMatrix
                      tasks={filteredTasks.filter((t) => t.listId === '1')}
                      onViewModal={handleViewModal}
                      onEditModal={handleEditModal}
                    />
                  )}
                </div>
              );
            }

            return (
              <Column
                key={list.id}
                list={list}
                tasks={getTasksForList(list.id)}
                onViewModal={handleViewModal}
                onEditModal={handleEditModal}
                isCollapsed={collapsedSections.has(list.id)}
                onToggleCollapse={() => toggleCollapsible(list.id)}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeId && <div className={styles.dragOverlay}>Moving task...</div>}
        </DragOverlay>
      </DndContext>

      {showModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          mode={modalMode}
          onModeChange={setModalMode}
          onClose={() => setShowModal(false)}
          onTaskUpdate={(updatedTask) => {
            setSelectedTask(updatedTask);
          }}
        />
      )}

      {addingToList && !showModal && (
        <AddTaskForm
          listId={addingToList}
          onClose={() => setAddingToList(null)}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Edit2, User, AlertCircle, CheckCircle2, Circle, Eye } from 'lucide-react';
import { TaskDetailModal } from './TaskDetailModal';
import { Switch, styled } from '@mui/material';
import styles from './TeamManagement.module.css';

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

export const TeamManagement: React.FC = () => {
  const [newMemberName, setNewMemberName] = useState('');
  const [showNeedsAttention, setShowNeedsAttention] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  const teamMembers = useStore((state) => state.teamMembers);
  const tasks = useStore((state) => state.tasks);
  const labels = useStore((state) => state.labels);
  const addTeamMember = useStore((state) => state.addTeamMember);
  const updateTeamMember = useStore((state) => state.updateTeamMember);
  const deleteTeamMember = useStore((state) => state.deleteTeamMember);
  const updateTask = useStore((state) => state.updateTask);

  const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      addTeamMember({
        name: newMemberName,
        avatarColor: colors[teamMembers.length % colors.length],
      });
      setNewMemberName('');
    }
  };

  // Inline renaming handled via prompt when user clicks edit.

  // Select first member by default when members list changes
  React.useEffect(() => {
    if (teamMembers.length > 0 && !selectedMemberId) {
      setSelectedMemberId(teamMembers[0].id);
    }
    if (teamMembers.length === 0) setSelectedMemberId(null);
  }, [teamMembers]);

  // Modal state for viewing task
  const [showModal, setShowModal] = useState(false);
  const [modalTask, setModalTask] = useState<null | any>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

  const openTaskModal = (task: any, mode: 'view' | 'edit' = 'view') => {
    setModalTask(task);
    setModalMode(mode);
    setShowModal(true);
  };

  const getMemberTasks = (memberId: string) => {
    let memberTasks = tasks.filter((t) => t.assignedTo === memberId);
    if (showNeedsAttention) {
      memberTasks = memberTasks.filter((t) => t.needsMyInput);
    }
    return memberTasks;
  };

  const getMemberStats = (memberId: string) => {
    const memberTasks = tasks.filter((t) => t.assignedTo === memberId);
    const needsAttention = memberTasks.filter((t) => t.needsMyInput);
    const completed = memberTasks.filter((t) => t.completed);
    return {
      total: memberTasks.length,
      needsAttention: needsAttention.length,
      completed: completed.length,
    };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Team Tasks</h1>
        <p>Assign and track tasks across team members</p>
      </div>

      <div className={styles.addMemberSection}>
        <h2>Add Team Member</h2>
        <div className={styles.addForm}>
          <input
            type="text"
            placeholder="Enter team member name"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
          />
          <button onClick={handleAddMember} className={styles.addBtn}>
            <Plus size={20} />
            Add Member
          </button>
        </div>
      </div>

      {teamMembers.length > 0 && (
        <div 
          className={styles.filterSection}
          onClick={() => setShowNeedsAttention(!showNeedsAttention)}
        >
          <div className={styles.filterLabel}>
            <AlertCircle size={18} />
            <span>Show tasks needing my input</span>
          </div>
          <CustomSwitch 
            checked={showNeedsAttention} 
            onChange={(_, checked) => setShowNeedsAttention(checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className={styles.membersSplit}>
        <div className={styles.membersList}>
          {teamMembers.length === 0 ? (
            <div className={styles.emptyState}>
              <User size={48} />
              <p>No team members yet. Add one to get started!</p>
            </div>
          ) : (
            teamMembers.map((member) => {
              const stats = getMemberStats(member.id);
              return (
                <div
                  key={member.id}
                  className={`${styles.memberCard} ${selectedMemberId === member.id ? styles.selected : ''}`}
                  onClick={() => setSelectedMemberId(member.id)}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className={styles.avatar} style={{ backgroundColor: member.avatarColor }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, color: '#fff' }}>{member.name}</h4>
                      <div className={styles.statsRow}>
                        <span className={styles.stat}>📋 {stats.total}</span>
                        {stats.needsAttention > 0 && (
                          <span className={styles.stat} style={{ color: '#ef4444' }}>⚠️ {stats.needsAttention}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.memberDetail}>
          {selectedMemberId ? (
            (() => {
              const member = teamMembers.find((m) => m.id === selectedMemberId)!;
              const memberTasks = getMemberTasks(member.id);
              return (
                <div>
                  <div className={styles.memberHeader}>
                    <div className={styles.memberInfo}>
                      <div className={styles.avatar} style={{ backgroundColor: member.avatarColor }}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.memberDetails}>
                        <h3>{member.name}</h3>
                        <div className={styles.statsRow}>
                          <span className={styles.stat}>📋 {memberTasks.length} tasks</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.memberActions}>
                      <button
                        onClick={() => {
                          const newName = prompt('Rename member', member.name);
                          if (newName && newName.trim()) {
                            updateTeamMember(member.id, { name: newName.trim() });
                          }
                        }}
                        className={styles.editBtn}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteTeamMember(member.id)}
                        className={styles.deleteBtn}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.tasksList + ' ' + styles.scrollableTasks}>
                    {memberTasks.length === 0 ? (
                      <p className={styles.noTasks}>{showNeedsAttention ? 'No tasks needing your input' : 'No tasks assigned'}</p>
                    ) : (
                              memberTasks.map((task) => (
                                <div key={task.id} className={`${styles.taskItem} ${task.completed ? styles.completed : ''} ${task.needsMyInput ? styles.needsAttention : ''}`}>
                                  <button className={styles.checkbox} onClick={() => updateTask(task.id, { completed: !task.completed })}>
                                    {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                  </button>

                                  <div className={styles.taskContent}>
                                    <p className={styles.taskTitle}>{task.title}</p>
                                    {task.description && <p className={styles.taskDescription}>{task.description}</p>}

                                    <div className={styles.taskMeta}>
                                      <span className={styles.priorityBadge} style={{ background: task.priority === 'urgent' ? '#ff3838' : task.priority === 'high' ? '#ff6b6b' : task.priority === 'medium' ? '#ffa500' : '#4ade80' }}>
                                        {task.priority?.toUpperCase()}
                                      </span>
                                      {task.dueDate && <span>📅 {task.dueDate}</span>}
                                      <span>🍅 {task.pomodoroCount}/{task.estimatedPomodoros}</span>
                                      {task.assignedTo && (
                                        <span>👤 {teamMembers.find((m) => m.id === task.assignedTo)?.name}</span>
                                      )}
                                      {task.labels && task.labels.length > 0 && (
                                        <span>
                                          {task.labels.map((lId: string) => labels.find((l) => l.id === lId)?.name).filter(Boolean).join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button className={styles.needsInputToggle} onClick={() => updateTask(task.id, { needsMyInput: !task.needsMyInput })} title={task.needsMyInput ? 'Remove from needs input' : 'Mark as needs input'}>
                                      {task.needsMyInput ? '⚠️' : '◯'}
                                    </button>

                                    <button className={styles.editBtn} onClick={() => openTaskModal(task, 'view')} title="View">
                                      <Eye size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className={styles.emptyState}><p>Select a team member to see their tasks</p></div>
          )}
        </div>
      </div>
      {showModal && modalTask && (
        <TaskDetailModal
          task={modalTask}
          mode={modalMode}
          onModeChange={setModalMode}
          onClose={() => setShowModal(false)}
          onTaskUpdate={(updated) => {
            // Reflect updates back in UI
            setModalTask(updated);
          }}
        />
      )}
    </div>
  );
};

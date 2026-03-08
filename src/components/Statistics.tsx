import React, { useMemo } from 'react';
import { useStore } from '../store';
import { TrendingUp, CheckCircle2, Clock, Zap, Target } from 'lucide-react';
import styles from './Statistics.module.css';

export const Statistics: React.FC = () => {
  const tasks = useStore((state) => state.tasks);
  const archivedTasks = useStore((state) => state.archivedTasks);
  const timeEntries = useStore((state) => state.timeEntries);
  const teamMembers = useStore((state) => state.teamMembers);
  const teamTasks = useStore((state) => state.teamTasks);
  const pomodoroSessions = useStore((state) => state.pomodoroSessions);

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const priorityDistribution = {
      urgent: tasks.filter((t) => t.priority === 'urgent').length,
      high: tasks.filter((t) => t.priority === 'high').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      low: tasks.filter((t) => t.priority === 'low').length,
    };

    const totalPomodoros = pomodoroSessions.length;
    const totalTimeSpent = timeEntries.reduce((acc, entry) => {
      const blocks = entry.timeBlocks.reduce((blockAcc, block) => blockAcc + block.duration, 0);
      return acc + blocks;
    }, 0);

    const allTasks = [...tasks, ...archivedTasks];
    const overdueTasks = allTasks.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    const upcomingTasks = allTasks.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return dueDate >= today && dueDate <= nextWeek;
    }).length;

    const teamPerformance = teamMembers.map((member) => {
      const memberTasks = teamTasks.filter((t) => t.assignedTo === member.id);
      const completedMemberTasks = memberTasks.filter((t) => t.status === 'completed').length;
      return {
        name: member.name,
        total: memberTasks.length,
        completed: completedMemberTasks,
        rate: memberTasks.length === 0 ? 0 : Math.round((completedMemberTasks / memberTasks.length) * 100),
      };
    });

    return {
      totalTasks,
      completedTasks,
      completionRate,
      priorityDistribution,
      totalPomodoros,
      totalTimeSpent,
      overdueTasks,
      upcomingTasks,
      teamPerformance,
      activeTeamMembers: teamMembers.length,
    };
  }, [tasks, archivedTasks, timeEntries, teamMembers, teamTasks, pomodoroSessions]);

  const getColorForPriority = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#3b82f6';
      case 'low':
        return '#06b6d4';
      default:
        return '#64748b';
    }
  };

  const calculateChartHeight = (value: number, max: number) => {
    return max === 0 ? 0 : (value / max) * 100;
  };

  const maxPriority = Math.max(...Object.values(stats.priorityDistribution));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Statistics & Analytics</h1>
        <p>Insights into your productivity and team performance</p>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Completion Rate</p>
            <h2 className={styles.metricValue}>{stats.completionRate}%</h2>
            <p className={styles.metricSubtext}>
              {stats.completedTasks} of {stats.totalTasks} tasks
            </p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ color: '#3b82f6' }}>
            <Target size={24} />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Total Tasks</p>
            <h2 className={styles.metricValue}>{stats.totalTasks}</h2>
            <p className={styles.metricSubtext}>
              {stats.overdueTasks} overdue, {stats.upcomingTasks} upcoming
            </p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ color: '#f59e0b' }}>
            <Zap size={24} />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Pomodoro Sessions</p>
            <h2 className={styles.metricValue}>{stats.totalPomodoros}</h2>
            <p className={styles.metricSubtext}>Active focus sessions</p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ color: '#8b5cf6' }}>
            <Clock size={24} />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Time Logged</p>
            <h2 className={styles.metricValue}>{stats.totalTimeSpent}h</h2>
            <p className={styles.metricSubtext}>Total hours tracked</p>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Priority Distribution</h3>
          <div className={styles.barChart}>
            {Object.entries(stats.priorityDistribution).map(([priority, count]) => (
              <div key={priority} className={styles.barContainer}>
                <div className={styles.barLabel}>
                  <span className={styles.labelText}>{priority}</span>
                  <span className={styles.labelValue}>{count}</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.bar}
                    style={{
                      height: `${calculateChartHeight(count, maxPriority)}%`,
                      backgroundColor: getColorForPriority(priority),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Team Performance</h3>
          <div className={styles.performanceList}>
            {stats.teamPerformance.length === 0 ? (
              <p className={styles.noData}>No team members yet</p>
            ) : (
              stats.teamPerformance.map((member, idx) => (
                <div key={idx} className={styles.performanceItem}>
                  <div className={styles.performanceInfo}>
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.taskCount}>
                      {member.completed}/{member.total}
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progress}
                      style={{ width: `${member.rate}%` }}
                    />
                  </div>
                  <span className={styles.percentage}>{member.rate}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={styles.summaryCard}>
        <h3>
          <TrendingUp size={20} />
          Performance Summary
        </h3>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Active Team Members</span>
            <span className={styles.summaryValue}>{stats.activeTeamMembers}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Overdue Tasks</span>
            <span className={styles.summaryValue} style={{ color: '#ef4444' }}>
              {stats.overdueTasks}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Upcoming This Week</span>
            <span className={styles.summaryValue} style={{ color: '#f59e0b' }}>
              {stats.upcomingTasks}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Completed</span>
            <span className={styles.summaryValue} style={{ color: '#10b981' }}>
              {stats.completedTasks}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

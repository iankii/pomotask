// Task Management
export interface Task {
  id: string;
  title: string;
  description: string;
  listId: string; // '1' = To Do, '2' = In Progress, '3' = Done
  priority: 'low' | 'medium' | 'high' | 'urgent';
  matrixQuadrant?: 'urgent-important' | 'important-not-urgent' | 'urgent-not-important' | 'not-urgent-not-important';
  labels: string[]; // Array of label IDs
  dueDate?: string; // ISO date string
  sprint: 'current' | 'future' | 'none';
  completed: boolean;
  createdAt: string;
  pomodoroCount: number;
  estimatedPomodoros: number;
  archivedAt?: string;
  assignedTo?: string; // Team member ID
  needsMyInput?: boolean; // Whether this task needs attention from assigned member
}

export interface List {
  id: string;
  title: string;
  color: string;
  order: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

// Team Management
export interface TeamTask {
  id: string;
  title: string;
  description: string;
  mrDetails: string;
  openQuestions: string;
  jiraTask: string;
  status: 'not-started' | 'in-progress' | 'in-review' | 'blocked' | 'completed';
  assignedTo: string; // Team member ID
  needsMyAttention: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatarColor: string; // Hex color
}

// Time Tracking
export interface TimeBlock {
  id: string;
  title?: string; // Optional label for time block
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  duration: number; // Auto-calculated in minutes
}

export interface TimeEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  activityType: 'meeting' | 'ad-hoc-meeting' | 'mr-review' | 'discussion' | 'lunch-break' | 'coffee-break' | 'training' | 'other';
  title: string;
  description?: string;
  timeBlocks: TimeBlock[]; // Multiple time blocks per entry
  duration: number; // Total duration (sum of all blocks)
  createdAt: string;
}

// Pomodoro
export interface PomodoroSession {
  taskId: string;
  startTime: string;
  endTime: string;
  completed: boolean;
}

export interface ActivePomodoro {
  mode: 'work' | 'shortBreak' | 'longBreak' | 'custom';
  timeLeft: number; // seconds
  isRunning: boolean;
  startTime: number; // timestamp
}

// Settings
export interface AppSettings {
  theme: 'dark'; // Only dark theme
  pomodoroLength: number; // Default: 25 minutes
  shortBreakLength: number; // Default: 5 minutes
  longBreakLength: number; // Default: 15 minutes
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  notificationsEnabled: boolean;
}

export interface AppState {
  // Tasks
  tasks: Task[];
  archivedTasks: Task[];
  lists: List[];
  labels: Label[];

  // Team
  teamMembers: TeamMember[];
  teamTasks: TeamTask[];
  archivedTeamTasks: TeamTask[];
  currentUserId?: string; // Current logged-in user's team member ID

  // Time Tracking
  timeEntries: TimeEntry[];

  // Pomodoro
  pomodoroSessions: PomodoroSession[];
  activePomodoro: ActivePomodoro | null;

  // Settings
  settings: AppSettings;

  // File handle for File System Access API
  fileHandle: FileSystemFileHandle | null;
}

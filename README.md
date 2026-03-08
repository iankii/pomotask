# Kanban Pomodoro Task Management App

A production-ready React + TypeScript application combining Kanban board task management with Pomodoro timer, team collaboration features, and time tracking.

## Features

### ✅ Core Task Management
- **Kanban Board**: Drag-and-drop task organization across To Do, In Progress, and Done columns
- **Eisenhower Matrix**: Prioritize tasks into 4 quadrants (Urgent/Important combinations)
- **Sprint Filters**: Filter tasks by Current Sprint or Future Sprint
- **Task Cards**: Rich task display with priority, labels, due dates, and pomodoro counts
- **Task Details Modal**: 90vw modal with view/edit modes for comprehensive task management
- **Priority System**: Low, Medium, High, Urgent with color-coded indicators

### ✅ Multiple Views
- **Today View**: Focused view of today's tasks and overdue items
- **Board View**: Full Kanban board with sprint filters and task organization
- **Team View**: Team task management (coming soon)
- **Statistics**: Analytics and metrics (coming soon)
- **Time Log**: Time tracking and activity logging (coming soon)

### ✅ Data Persistence
- **localStorage**: Auto-saves all data to browser storage
- **File System Access API**: Optional JSON file export/import with persistent file handle
- **Debounced Saving**: 1-second debounce to optimize performance

### ✅ Dark Theme
- Professional dark color scheme with high contrast
- Smooth transitions and animations
- Responsive design for mobile, tablet, and desktop

### ✅ Drag and Drop
- Powered by @dnd-kit/core for smooth, performant dragging
- Drag tasks between columns and Eisenhower Matrix quadrants
- Visual feedback and animations
- Automatic state updates on drop

## Tech Stack

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "lucide-react": "^0.294.0",
    "zustand": "^4.4.7",
    "date-fns": "^3.0.0"
  }
}
```

- **Build Tool**: Vite 7.3.1
- **State Management**: Zustand
- **UI Framework**: React 18
- **Language**: TypeScript 5
- **Styling**: CSS Modules with CSS Variables
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx       # Navigation header (5 tabs)
│   ├── Board.tsx        # Kanban board container
│   ├── Column.tsx       # Kanban column component
│   ├── TaskCard.tsx     # Individual task card
│   ├── TaskDetailModal.tsx # Task view/edit modal
│   ├── EisenhowerMatrix.tsx # Priority matrix
│   ├── AddTaskForm.tsx  # Quick task add form
│   ├── TodayView.tsx    # Today's focus view
│   ├── SliderToggle.tsx # Toggle switch component
│   ├── SegmentedControl.tsx # Segmented button group
│   └── ...              # Other view components
├── store.ts             # Zustand state management
├── types.ts             # TypeScript interfaces
├── App.tsx              # Main app component
├── App.css              # App styles
├── index.css            # Global styles
└── main.tsx             # Entry point
```

## Getting Started

### Installation

```bash
cd task-pomodoro
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:5174` (or next available port)

### Build

```bash
npm run build
```

Build artifacts go to `/dist` folder.

### Preview

```bash
npm run preview
```

## Features In Detail

### Kanban Board

- **Three Columns**: To Do (with Eisenhower Matrix), In Progress, Done
- **Sprint Filters**: Toggle between Current Sprint and Future Sprint
- **Column Features**:
  - Task count badges
  - Color-coded top borders
  - Drop zones for empty columns
  - Add task buttons

### Task Cards

- **Visual Design**:
  - Left border (4px) colored by priority
  - Hover effects with action buttons
  - Completion checkbox
  - Drag handle

- **Information Display**:
  - Task title (truncated)
  - Description preview (2 lines)
  - Color-coded labels
  - Sprint indicator (clickable to cycle)
  - Due date status (Overdue, Today, Tomorrow, Soon, Future)
  - Pomodoro count (completed/estimated)

- **Actions** (appear on hover):
  - View: Opens read-only modal
  - Edit: Opens edit modal
  - Archive: Moves to archived tasks
  - Delete: Removes task (with confirmation)

### Task Detail Modal

- **90vw Modal** with smooth animations
- **View Mode**: Read-only display of all task details
- **Edit Mode**: Full form for updating task properties
- **Mode Toggle**: Eye/Edit2 button to switch between modes
- **Metadata Grid**: Priority, due date, sprint, pomodoros, quadrant, labels
- **Footer Actions**: Delete (left), Close (right), Save (edit mode only)

### Eisenhower Matrix

Four color-coded quadrants in the "To Do" column:
- **Do First** (Red): Urgent & Important
- **Schedule** (Blue): Important, Not Urgent  
- **Delegate** (Orange): Urgent, Not Important
- **Eliminate** (Gray): Not Urgent, Not Important

Each quadrant acts as a drop zone for task organization.

### Today View

Shows:
- **Overdue Tasks**: Tasks past due date
- **Today's Tasks**: Tasks due today
- **Completed Today**: Finished tasks for the day

## State Management (Zustand)

### Store Structure

```typescript
{
  // Tasks
  tasks: Task[]
  archivedTasks: Task[]
  lists: List[]
  labels: Label[]

  // Team (future)
  teamMembers: TeamMember[]
  teamTasks: TeamTask[]
  archivedTeamTasks: TeamTask[]

  // Time Tracking (future)
  timeEntries: TimeEntry[]

  // Pomodoro (future)
  pomodoroSessions: PomodoroSession[]

  // Settings
  settings: AppSettings
  fileHandle: FileSystemFileHandle | null
}
```

### Key Actions

**Task Operations**: `addTask`, `updateTask`, `deleteTask`, `moveTask`, `archiveTask`, `unarchiveTask`

**List Operations**: `addList`, `updateList`, `deleteList`, `reorderLists`

**Label Operations**: `addLabel`, `updateLabel`, `deleteLabel`

**Persistence**: `saveToLocalStorage`, `saveToFile`, `initializeStore`

## Data Persistence

### Strategy
1. Auto-save to localStorage on every state change (debounced 1s)
2. Optional File System Access API for persistent JSON file saving
3. On app load, restore from localStorage first, then attempt file handle if available
4. Data is never reset on app launch - existing data is always preserved

### Saved Data
- All tasks and archived tasks
- Lists, labels, and settings
- Team members and team tasks
- Time entries and Pomodoro sessions

## Color System

### Priority Colors
- Urgent: `#ef4444` (Red)
- High: `#f97316` (Orange)
- Medium: `#f59e0b` (Amber)
- Low: `#10b981` (Green)

### Status Colors
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Danger: `#ef4444` (Red)
- Info: `#06b6d4` (Cyan)

### Theme
- Background Primary: `#0f172a`
- Background Secondary: `#1e293b`
- Text Primary: `#f1f5f9`
- Border: `#334155`

## Accessibility

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- High contrast ratios (WCAG AA compliant)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires support for:
- CSS Variables
- ES2020+ JavaScript
- File System Access API (for file persistence feature)

## Future Enhancements

### Phase 2
- [ ] Complete Team Management view
- [ ] Implement Time Log and tracking
- [ ] Add Pomodoro Timer widget
- [ ] Statistics and analytics dashboard
- [ ] Global search (Ctrl+K)

### Phase 3
- [ ] Recurring tasks
- [ ] Subtasks and checklists
- [ ] Task templates
- [ ] Calendar integration
- [ ] Notifications
- [ ] Export to PDF

## Performance

- **Bundle Size**: ~274 KB (ungzipped), ~87 KB (gzipped)
- **Load Time**: < 500ms on modern hardware
- **Smooth 60fps animations** with CSS transforms
- **Debounced state saves** to prevent excessive writes
- **Optimized re-renders** with Zustand

## Testing Checklist

- [ ] Create tasks with all properties
- [ ] Drag tasks between columns
- [ ] Drag tasks within Eisenhower Matrix
- [ ] Toggle task completion
- [ ] Edit task details
- [ ] Archive/unarchive tasks
- [ ] Apply sprint filters
- [ ] Switch between views
- [ ] Data persists after refresh
- [ ] Export/import JSON works

## Development

### Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm install      # Install dependencies
```

### Adding Components

1. Create component file in `src/components/`
2. Add CSS module for styling
3. Export from `src/components/index.ts`
4. Import where needed

### Code Style

- Use functional components with hooks
- TypeScript for all new code
- CSS Modules for component styles
- Zustand for state management
- Lucide React for icons

## Contributing

This is a production-ready template. Feel free to fork and customize for your needs!

## License

MIT

---

**Created**: March 2026  
**Framework**: React 18 + TypeScript  
**Build Tool**: Vite  
**License**: MIT

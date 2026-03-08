# Design System - Task Management App

## Color Palette Overview

### Primary Action Color
- **Orange (#ff6b35)** - Used for buttons, CTAs, and primary interactions
- Creates clear call-to-action points

### Status/State Colors (Task Left Border)
- **Blue (#7b8cff)** - TODO tasks (default)
- **Cyan (#00d9ff)** - In Progress tasks
- **Orange (#ffa500)** - Under Review
- **Green (#10b981)** - Completed tasks

### Priority Indicators (Left Border)
- **Bright Red (#ff3838)** - Urgent priority
- **Red (#ff6b6b)** - High priority
- **Orange (#ffa500)** - Medium priority
- **Green (#4ade80)** - Low priority

### Attention State
- **Red (#ff6b6b)** - "Needs My Attention" toggle (ON state)
- Used for alert states and requires action indicators

### Background Palette (Dark Theme)
- **#0a0a0a** - Primary (Page Background)
- **#1a1a1a** - Secondary (Cards, Sections)
- **#2d2d2d** - Tertiary (Hover states)
- **#3a3a3a** - Hover (Interactive elements)
- **#141414** - Card specific background

### Text Colors
- **#ffffff** - Primary text (White)
- **#e0e0e0** - Secondary text (Light Gray)
- **#a0a0a0** - Tertiary text (Medium Gray)
- **#707070** - Muted text (Dark Gray)

## Component Color Usage

### Task Cards
- **Left Border**: Colored based on task status/priority
  - Task status: Blue (TODO) → Cyan (In Progress) → Green (Done)
  - Color changes based on task.priority field
- **Background**: Dark card background (#141414)
- **Hover State**: Enhanced border color with subtle glow

### Filter Toggle (Needs My Attention)
- **OFF State**: Gray track (#3a3a3a) with gray button (#707070)
- **ON State**: Red track (#ff6b6b) with white button
- **Animation**: Smooth elastic transition

### Buttons
- **Primary CTA**: Orange gradient (#ff6b35 → #ff5722)
- **Hover**: Enhanced shadow with orange glow
- **Secondary**: Transparent with border

### Input Fields
- **Default Border**: Dark border (#2d2d2d)
- **Focus Border**: Red (#ff6b6b) for attention
- **Background**: Pure black (#0a0a0a)

### Member/Team Cards
- **Border Hover**: Red (#ff6b6b) - indicates interactive state
- **Stats**: Orange accent for values
- **Actions**: Red hover for edit/delete

## Design Principles

1. **Clear Differentiation**: Each color serves a specific purpose
2. **High Contrast**: Dark backgrounds with bright accent colors
3. **Functional Color**: Colors indicate status, not just aesthetics
4. **Consistency**: Same color used for same purpose across app
5. **Professional**: Inspired by Linear, Notion, and Asana
6. **Accessibility**: High contrast ratios for readability

## Color Psychology

- **Blue (#7b8cff)**: Trust, work, neutral (TODO state)
- **Cyan (#00d9ff)**: Activity, progress, motion (In Progress)
- **Orange (#ff6b35)**: Action, urgent, attention (Primary CTA)
- **Red (#ff6b6b)**: Alert, important, requires action (High Priority/Needs Attention)
- **Green (#10b981)**: Success, completion, done (Completed tasks)

## Usage Examples

### Task that needs attention
```
Card: Blue left border (TODO)
Toggle: Red switch (ON)
Indicates: Task needs my attention
```

### High priority urgent task
```
Card: Bright red left border (#ff3838)
Background: Dark card
Hover: Enhanced red glow
Indicates: Urgent action needed
```

### Completed task
```
Card: Green left border (#10b981)
Opacity: 60%
Indicates: Task is done
```

## Responsive Design
- All colors maintain contrast in light/dark modes
- Hover states enhance interactivity feedback
- Animations use elastic curves for premium feel

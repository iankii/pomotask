import { useEffect, useState } from 'react';
import { useStore } from './store';
import {
  Header,
  Board,
  TodayView,
  TeamManagement,
  Statistics,
  TimeLog,
  PomodoroTimer,
  PomodoroFloatingButton,
} from './components';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('board');
  const [showPomodoroModal, setShowPomodoroModal] = useState(false);
  const { initializeStore } = useStore();

  useEffect(() => {
    initializeStore();
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header activeView={activeView} onViewChange={setActiveView} />

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeView === 'today' && <TodayView />}
        {activeView === 'board' && <Board />}
        {activeView === 'team' && <TeamManagement />}
        {activeView === 'stats' && <Statistics />}
        {activeView === 'time-log' && <TimeLog />}
      </main>

      <PomodoroFloatingButton onOpen={() => setShowPomodoroModal(true)} />

      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: showPomodoroModal ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        // Close only if clicking on the overlay background, not the modal content
        if (e.target === e.currentTarget) {
          setShowPomodoroModal(false);
        }
      }}>
        <div 
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '0.75rem',
            maxHeight: '90vh',
            overflow: 'auto',
            maxWidth: '800px',
            width: '90%',
            position: 'relative',
          }}
          onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          <button
            onClick={() => setShowPomodoroModal(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'transparent',
              border: 'none',
              color: '#e2e8f0',
              fontSize: '1.5rem',
              cursor: 'pointer',
              zIndex: 1001,
            }}
          >
            ✕
          </button>
          <PomodoroTimer />
        </div>
      </div>
    </div>
  );
}

export default App;

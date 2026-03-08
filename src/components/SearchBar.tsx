import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Search, X, AlertCircle } from 'lucide-react';
import styles from './SearchBar.module.css';

interface SearchResult {
  type: 'task' | 'member' | 'entry';
  id: string;
  title: string;
  description?: string;
  meta?: string;
  priority?: string;
}

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tasks = useStore((state) => state.tasks);
  const archivedTasks = useStore((state) => state.archivedTasks);
  const teamMembers = useStore((state) => state.teamMembers);
  const timeEntries = useStore((state) => state.timeEntries);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const newResults: SearchResult[] = [];

    // Search tasks
    [...tasks, ...archivedTasks].forEach((task) => {
      if (
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description?.toLowerCase().includes(lowerQuery)
      ) {
        newResults.push({
          type: 'task',
          id: task.id,
          title: task.title,
          description: task.description,
          meta: task.priority,
        });
      }
    });

    // Search team members
    teamMembers.forEach((member) => {
      if (member.name.toLowerCase().includes(lowerQuery)) {
        newResults.push({
          type: 'member',
          id: member.id,
          title: member.name,
          description: 'Team Member',
        });
      }
    });

    // Search time entries
    timeEntries.forEach((entry) => {
      const description = entry.description || entry.title;
      if (description && description.toLowerCase().includes(lowerQuery)) {
        newResults.push({
          type: 'entry',
          id: entry.id,
          title: description,
          meta: `${entry.duration}h on ${entry.date}`,
        });
      }
    });

    setResults(newResults.slice(0, 8));
    setSelectedIndex(0);
  }, [query, tasks, archivedTasks, teamMembers, timeEntries]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      // Handle selection
      setQuery('');
      setIsOpen(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#3b82f6';
      default:
        return '#06b6d4';
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'member':
        return '👤';
      case 'entry':
        return '⏱️';
      default:
        return '📌';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Search</h1>
        <p>Find tasks, team members, and time entries</p>
      </div>

      <div className={styles.searchWrapper}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search... (Cmd+K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className={styles.searchInput}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className={styles.clearBtn}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className={styles.dropdownContainer}>
            {query.trim() === '' ? (
              <div className={styles.emptyState}>
                <Search size={32} />
                <p>Start typing to search</p>
                <span className={styles.shortcut}>⌘K to open</span>
              </div>
            ) : results.length === 0 ? (
              <div className={styles.noResults}>
                <AlertCircle size={32} />
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              <div className={styles.resultsList}>
                {results.map((result, index) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className={`${styles.resultItem} ${
                      index === selectedIndex ? styles.selected : ''
                    }`}
                  >
                    <span className={styles.resultIcon}>
                      {getResultIcon(result.type)}
                    </span>
                    <div className={styles.resultContent}>
                      <p className={styles.resultTitle}>{result.title}</p>
                      <p className={styles.resultMeta}>
                        {result.description && (
                          <>
                            {result.description}
                            {result.meta && ' • '}
                          </>
                        )}
                        {result.type === 'task' && result.meta && (
                          <span
                            style={{
                              color: getPriorityColor(result.meta),
                              fontWeight: 600,
                            }}
                          >
                            {result.meta}
                          </span>
                        )}
                        {result.type === 'entry' && result.meta && result.meta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Close on outside click */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={styles.statsSection}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📌</span>
          <div>
            <p className={styles.statLabel}>Total Tasks</p>
            <p className={styles.statValue}>{tasks.length + archivedTasks.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👤</span>
          <div>
            <p className={styles.statLabel}>Team Members</p>
            <p className={styles.statValue}>{teamMembers.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>⏱️</span>
          <div>
            <p className={styles.statLabel}>Time Entries</p>
            <p className={styles.statValue}>{timeEntries.length}</p>
          </div>
        </div>
      </div>

      <div className={styles.tipsSection}>
        <h3>Search Tips</h3>
        <ul>
          <li>Use <code>Cmd+K</code> or <code>Ctrl+K</code> to open search</li>
          <li>Search by task title or description</li>
          <li>Find team members by name</li>
          <li>Look up time entries by description</li>
          <li>Use arrow keys to navigate results</li>
        </ul>
      </div>
    </div>
  );
};

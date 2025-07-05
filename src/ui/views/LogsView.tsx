import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/Button/Button.js';
import { Input } from '../components/Input/Input.js';
import styles from './LogsView.module.css';

export type LogLevel = 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';
export type LogSource = 'auth' | 'database' | 'payment' | 'system' | 'plugin' | string;

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: LogSource;
  message: string;
  pluginId?: string;
}

export interface LogsViewProps {
  plugins: Array<{ id: string; name: string }>;
}

export function LogsView({ plugins }: LogsViewProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<Set<LogLevel>>(new Set(['ERROR', 'WARNING', 'INFO']));
  const [selectedPlugin, setSelectedPlugin] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate demo logs
  useEffect(() => {
    const generateDemoLogs = () => {
      const sources: LogSource[] = ['auth', 'database', 'payment', 'system'];
      const levels: LogLevel[] = ['ERROR', 'WARNING', 'INFO', 'DEBUG'];
      const messages = {
        auth: [
          'User successfully authenticated',
          'Failed to authenticate user',
          'Session expired for user',
          'Password reset requested',
          'Invalid token provided'
        ],
        database: [
          'Database connected',
          'Connection pool limit exceeded',
          'Query executed successfully',
          'Database backup completed',
          'Connection timeout'
        ],
        payment: [
          'Payment request succeeded',
          'Payment processing failed',
          'Payment gateway connected',
          'Refund processed',
          'Payment validation error'
        ],
        system: [
          'Application started',
          'Configuration loaded',
          'System health check passed',
          'Memory usage warning',
          'System shutdown initiated'
        ]
      };

      const demoLogs: LogEntry[] = [];
      const now = new Date();

      for (let i = 0; i < 50; i++) {
        const source = sources[Math.floor(Math.random() * sources.length)];
        const level = levels[Math.floor(Math.random() * levels.length)];
        const messageList = messages[source as keyof typeof messages] || ['System message'];
        const message = messageList[Math.floor(Math.random() * messageList.length)];
        
        demoLogs.unshift({
          id: `log-${i}`,
          timestamp: new Date(now.getTime() - (i * 30000) - Math.random() * 30000),
          level,
          source,
          message,
          pluginId: Math.random() > 0.7 && plugins.length > 0 ? plugins[Math.floor(Math.random() * plugins.length)].id : undefined
        });
      }

      setLogs(demoLogs);
    };

    generateDemoLogs();
  }, [plugins]);

  // Simulate real-time logs
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const sources: LogSource[] = ['auth', 'database', 'payment', 'system'];
      const levels: LogLevel[] = ['ERROR', 'WARNING', 'INFO'];
      const messages = [
        'New user session created',
        'Database query completed',
        'Payment processed successfully',
        'System check passed',
        'Configuration updated'
      ];

      const newLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        level: levels[Math.floor(Math.random() * levels.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        pluginId: Math.random() > 0.8 && plugins.length > 0 ? plugins[Math.floor(Math.random() * plugins.length)].id : undefined
      };

      setLogs(prev => [newLog, ...prev.slice(0, 999)]); // Keep last 1000 logs
    }, 3000 + Math.random() * 2000); // Random interval between 3-5 seconds

    return () => clearInterval(interval);
  }, [isLive, plugins]);

  // Filter logs
  useEffect(() => {
    let filtered = logs;

    // Filter by log levels
    filtered = filtered.filter(log => selectedLevels.has(log.level));

    // Filter by plugin
    if (selectedPlugin !== 'all') {
      if (selectedPlugin === 'system') {
        filtered = filtered.filter(log => !log.pluginId);
      } else {
        filtered = filtered.filter(log => log.pluginId === selectedPlugin);
      }
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        log.source.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, selectedLevels, selectedPlugin, searchTerm]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  const handleLevelToggle = (level: LogLevel) => {
    const newSelectedLevels = new Set(selectedLevels);
    if (newSelectedLevels.has(level)) {
      newSelectedLevels.delete(level);
    } else {
      newSelectedLevels.add(level);
    }
    setSelectedLevels(newSelectedLevels);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleExportLogs = () => {
    const logData = filteredLogs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      source: log.source,
      message: log.message,
      plugin: log.pluginId || 'system'
    }));

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnia-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLevelBadgeClass = (level: LogLevel) => {
    switch (level) {
      case 'ERROR': return styles.errorBadge;
      case 'WARNING': return styles.warningBadge;
      case 'INFO': return styles.infoBadge;
      case 'DEBUG': return styles.debugBadge;
      default: return styles.infoBadge;
    }
  };

  return (
    <div className={styles.logsView}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Logs</h1>
            <p className={styles.subtitle}>Application and plugin log monitoring</p>
          </div>
          {isLive && (
            <div className={styles.liveIndicator}>
              <div className={styles.liveDot}></div>
              LIVE
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Filters</h3>
            
            {/* Log Level Filters */}
            <div className={styles.filterGroup}>
              <div 
                className={`${styles.filterItem} ${selectedLevels.has('ERROR') ? styles.active : ''}`}
                onClick={() => handleLevelToggle('ERROR')}
              >
                <input 
                  type="checkbox" 
                  checked={selectedLevels.has('ERROR')}
                  onChange={() => handleLevelToggle('ERROR')}
                  className={styles.checkbox}
                />
                <span className={`${styles.levelIndicator} ${styles.error}`}></span>
                <span>Error</span>
              </div>
              
              <div 
                className={`${styles.filterItem} ${selectedLevels.has('WARNING') ? styles.active : ''}`}
                onClick={() => handleLevelToggle('WARNING')}
              >
                <input 
                  type="checkbox" 
                  checked={selectedLevels.has('WARNING')}
                  onChange={() => handleLevelToggle('WARNING')}
                  className={styles.checkbox}
                />
                <span className={`${styles.levelIndicator} ${styles.warning}`}></span>
                <span>Warning</span>
              </div>
              
              <div 
                className={`${styles.filterItem} ${selectedLevels.has('INFO') ? styles.active : ''}`}
                onClick={() => handleLevelToggle('INFO')}
              >
                <input 
                  type="checkbox" 
                  checked={selectedLevels.has('INFO')}
                  onChange={() => handleLevelToggle('INFO')}
                  className={styles.checkbox}
                />
                <span className={`${styles.levelIndicator} ${styles.info}`}></span>
                <span>Info</span>
              </div>
            </div>
          </div>

          {/* Plugin Filter */}
          <div className={styles.filterSection}>
            <label className={styles.filterLabel}>Source</label>
            <select 
              value={selectedPlugin}
              onChange={(e) => setSelectedPlugin(e.target.value)}
              className={styles.select}
            >
              <option value="all">All plugins</option>
              <option value="system">System</option>
              {plugins.map(plugin => (
                <option key={plugin.id} value={plugin.id}>
                  {plugin.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className={styles.filterSection}>
            <div className={styles.actionButtons}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportLogs}
                className="w-full mb-2"
              >
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearLogs}
                className="w-full"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Live Toggle */}
          <div className={styles.filterSection}>
            <div className={styles.toggleSection}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={isLive}
                  onChange={(e) => setIsLive(e.target.checked)}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleSlider}></span>
                Live Updates
              </label>
            </div>
          </div>
        </aside>

        {/* Main Log Area */}
        <main className={styles.main}>
          {/* Search */}
          <div className={styles.searchSection}>
            <Input
              type="search"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Log Entries */}
          <div 
            ref={containerRef}
            className={styles.logContainer}
            onScroll={(e) => {
              const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
              const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
              setAutoScroll(isAtBottom);
            }}
          >
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div key={log.id} className={styles.logEntry}>
                  <div className={styles.logTimestamp}>
                    {formatTime(log.timestamp)}
                  </div>
                  <div className={`${styles.logLevel} ${getLevelBadgeClass(log.level)}`}>
                    {log.level}
                  </div>
                  <div className={styles.logSource}>
                    {log.pluginId ? plugins.find(p => p.id === log.pluginId)?.name || log.source : log.source}
                  </div>
                  <div className={styles.logMessage}>
                    {log.message}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No logs match the current filters.</p>
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </main>
      </div>
    </div>
  );
}
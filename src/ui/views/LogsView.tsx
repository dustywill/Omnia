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

  // Parse log file content into LogEntry objects
  const parseLogContent = (content: string): LogEntry[] => {
    if (!content || content.trim() === '') {
      return [];
    }
    
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const logs: LogEntry[] = [];
    
    lines.forEach((line, index) => {
      // Parse log format: [2025-07-05T23:44:59.873Z] [electron-main] [INFO] Starting Electron application with console logging enabled
      const match = line.match(/^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]\s+\[([^\]]+)\]\s+\[(ERROR|WARNING|INFO|DEBUG)\]\s+(.+)$/);
      
      if (match) {
        const [, isoTimestamp, component, level, message] = match;
        const timestamp = new Date(isoTimestamp);
        
        // Extract plugin ID from component if it follows pattern "renderer-pluginId"
        const pluginMatch = component.match(/^renderer-(.+)$/);
        const pluginId = pluginMatch ? pluginMatch[1] : undefined;
        
        // Determine source from component name
        let source: LogSource = 'system';
        if (component.includes('plugin') || pluginId) {
          source = 'plugin';
        } else if (component.includes('auth')) {
          source = 'auth';
        } else if (component.includes('database')) {
          source = 'database';
        } else if (component.includes('payment')) {
          source = 'payment';
        } else if (component.includes('electron')) {
          source = 'system';
        } else if (component.includes('CONSOLE')) {
          source = 'system';
        } else {
          source = component;
        }
        
        logs.push({
          id: `log-${index}-${Date.now()}`,
          timestamp,
          level: level as LogLevel,
          source,
          message,
          pluginId
        });
      }
    });
    
    // Sort by timestamp descending (newest first)
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Load real logs from file
  useEffect(() => {
    const loadLogsFromFile = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).electronAPI?.readLogFile) {
          const logContent = await (window as any).electronAPI.readLogFile();
          const parsedLogs = parseLogContent(logContent);
          setLogs(parsedLogs);
        } else {
          // Fallback for non-Electron environment
          setLogs([]);
        }
      } catch (error) {
        console.error('Failed to load logs:', error);
        setLogs([]);
      }
    };

    loadLogsFromFile();
  }, []);

  // Live refresh logs from file
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).electronAPI?.readLogFile) {
          const logContent = await (window as any).electronAPI.readLogFile();
          const parsedLogs = parseLogContent(logContent);
          setLogs(parsedLogs);
        }
      } catch (error) {
        console.error('Failed to refresh logs:', error);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [isLive]);

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
    // Since logs are read from file, we can't clear them directly
    // This would require clearing the actual log file, which should be done carefully
    console.warn('Clear logs functionality disabled - logs are read from file');
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
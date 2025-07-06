#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

/**
 * Clear the application log file for development sessions
 * Only runs in development mode to avoid clearing production logs
 */
async function clearLogs() {
  try {
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    
    if (!isDevelopment) {
      console.log('Not in development mode, skipping log clear');
      return;
    }

    const logDir = 'logs';
    const logFile = path.join(logDir, 'app.log');
    
    // Ensure log directory exists
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      // Directory already exists, ignore
    }
    
    // Clear the log file by writing a session start marker
    const timestamp = new Date().toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
      year: 'numeric'
    });
    
    const sessionMarker = `Log cleared at ${timestamp}\n`;
    await fs.writeFile(logFile, sessionMarker, 'utf8');
    
    console.log(`✓ Log file cleared for new development session: ${logFile}`);
  } catch (error) {
    console.warn(`Warning: Could not clear log file: ${error.message}`);
    // Don't fail the build if we can't clear logs
  }
}

clearLogs();
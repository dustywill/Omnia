#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const logFile = 'test-results.log';
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

console.log(`Running tests and logging to ${logFile}...`);

const child = spawn('node', [
  '--experimental-vm-modules',
  './node_modules/.bin/jest'
], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

// Pipe stdout to both console and log file
child.stdout.on('data', (data) => {
  process.stdout.write(data);
  logStream.write(data);
});

// Pipe stderr to both console and log file
child.stderr.on('data', (data) => {
  process.stderr.write(data);
  logStream.write(data);
});

child.on('close', (code) => {
  logStream.end();
  console.log(`\nTest results saved to ${logFile}`);
  process.exit(code);
});

child.on('error', (error) => {
  console.error(`Failed to start test process: ${error.message}`);
  logStream.end();
  process.exit(1);
});
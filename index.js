#!/usr/bin/env node

import concurrently from 'concurrently';
import { runAllTests } from './test-runner.js';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Load Angular projects from angular.json
const angularJsonPath = path.resolve(process.cwd(), 'angular.json');
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
const projects = Object.keys(angularJson.projects);

// Get the number of CPU cores
const numCPUs = os.cpus().length;

// Get concurrency from command line arguments or default to CPU cores
const args = process.argv.slice(2);
const concurrency = args.length > 0 ? parseInt(args[0], 10) : numCPUs;

// Check if concurrently is installed
try {
    execSync('npx concurrently -v');
} catch (e) {
    console.error('Error: concurrently is not installed. Run "npm install concurrently" to install it.');
    process.exit(1);
}

// Run all tests with specified concurrency
runAllTests(concurrency, projects);

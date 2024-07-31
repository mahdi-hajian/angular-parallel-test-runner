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
const defaultConcurrency = Math.max(1, Math.floor(numCPUs / 3)); // Set default to half the number of CPU cores, minimum 1

// Get concurrency and continueOnFailure from command line arguments or default values
const args = process.argv.slice(2);
const concurrency = args.length > 0 ? parseInt(args[0], 10) : defaultConcurrency;
const continueOnFailure = args.length > 1 ? args[1].toLowerCase() === 'true' : true;

// Check if concurrently is installed
try {
    execSync('npx concurrently -v');
} catch (e) {
    console.error('Error: concurrently is not installed. Run "npm install concurrently" to install it.');
    process.exit(1);
}

// Run all tests with specified concurrency
runAllTests(concurrency, continueOnFailure, projects.filter(x => x != "la-dw"));

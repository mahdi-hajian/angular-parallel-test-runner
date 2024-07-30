#!/usr/bin/env node

const concurrently = require('concurrently');
const runAllTests = require('./test-runner');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load Angular projects from angular.json
const angularJsonPath = path.resolve(process.cwd(), 'angular.json');
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
const projects = Object.keys(angularJson.projects);

// Check if concurrently is installed
try {
  execSync('npx concurrently -v');
} catch (e) {
  console.error('Error: concurrently is not installed. Run "npm install concurrently" to install it.');
  process.exit(1);
}

// Run all tests in parallel
runAllTests(projects);

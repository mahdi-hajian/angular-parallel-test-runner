import { exec } from 'child_process';
import PQueue from 'p-queue';
import find from 'find-process';
import chalk from 'chalk';

function extractPort(output) {
  const portRegex = /(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)/;
  const match = output.match(portRegex);
  return match ? match[1] : null;
}

function runTests(project, processList, ports, results) {
  return new Promise((resolve, reject) => {
    const testProcess = exec(`ng test ${project} --no-watch`, (error, stdout, stderr) => {
      if (error) {
        if (error.message.includes("No inputs were found in config file")) {
          console.log(chalk.yellow(`Project ${project}: No tests found.`));
          results.noTests.push(project);
          resolve(`Project ${project}: No tests found.`);
        } else {
          console.error(chalk.red(`Error running tests for ${project}: ${error.message}`));
          results.failedTests.push(project);
          reject(new Error(`Project ${project}: Error running tests - ${error.message}`));
        }
      } else {
        console.log(chalk.green(`Test results for ${project}:\n${stdout}`));
        const port = extractPort(stdout);
        if (port) {
          ports.push(port);
        }
        results.successfulTests.push(project);
        resolve(`Project ${project}: Tests passed successfully.\n${stdout}`);
      }
    });

    processList.push(testProcess);
  });
}

async function killProcessesOnPorts(ports) {
  for (const port of ports) {
    try {
      const list = await find('port', port);
      list.forEach(proc => {
        try {
          process.kill(proc.pid, 'SIGKILL');
          console.log(chalk.blue(`Killed process ${proc.pid} on port ${port}`));
        } catch (e) {
          console.error(chalk.red(`Failed to kill process ${proc.pid} on port ${port}: ${e.message}`));
        }
      });
    } catch (err) {
      console.error(chalk.red(`Error finding processes on port ${port}: ${err.message}`));
    }
  }
}

export async function runAllTests(concurrency, projects) {
  const processList = [];
  const ports = [];
  const queue = new PQueue({ concurrency });

  const results = {
    noTests: [],
    successfulTests: [],
    failedTests: [],
    unfinishedTests: []
  };

  const testPromises = projects.map(project =>
    queue.add(() => runTests(project, processList, ports, results))
  );

  try {
    await Promise.all(testPromises);
    console.log(chalk.green('All tests completed successfully'));
  } catch (error) {
    console.error(chalk.red('Some tests failed, aborting all tests'));
    processList.forEach(proc => {
      try {
        if (proc && proc.kill) {
          proc.kill('SIGINT');
        }
      } catch (e) {
        console.error(chalk.red(`Failed to kill process: ${e.message}`));
      }
    });
    console.error(chalk.red(error.message));
  } finally {
    // Kill all processes on the found ports
    // await killProcessesOnPorts(ports);

    // Log the summary
    console.log(chalk.bold('Test Summary:'));
    console.log(chalk.yellow(`Projects with no tests: ${results.noTests.join(', ')}`));
    console.log(chalk.green(`Projects with successful tests: ${results.successfulTests.join(', ')}`));
    console.log(chalk.red(`Projects with failed tests: ${results.failedTests.join(', ')}`));
    console.log(chalk.blue(`Projects with unfinished tests: ${projects.filter(project => 
      !results.noTests.includes(project) && 
      !results.successfulTests.includes(project) && 
      !results.failedTests.includes(project)
    ).join(', ')}`));

    queue.clear();
    process.exit(results.failedTests.length > 0 ? 1 : 0);
  }
}

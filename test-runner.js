import { exec } from 'child_process';
import PQueue from 'p-queue';
import chalk from 'chalk';

function extractPort(output) {
  const portRegex = /(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)/;
  const match = output.match(portRegex);
  return match ? match[1] : null;
}

const pattern = new RegExp(/TOTAL: \d+ FAILED/);

function successAction(stdout, project, ports, results, resolve) {
  const splWithTotal = stdout.split("TOTAL: ");
  const countOfTests = splWithTotal[splWithTotal.length - 1].split(" ")[0];
  console.log(chalk.green(`Project ${project}: ${countOfTests} Tests passed successfully`));
  const port = extractPort(stdout);
  if (port) {
    ports.push(port);
  }
  results.successfulTests.push(project);
  resolve(`Project ${project}: Tests passed successfully.\n${stdout}`);
}

function runTests(project, processList, ports, results, errorLogs) {
  return new Promise((resolve, reject) => {
    const command = `ng test ${project} --browsers ChromeHeadlessNoSandbox --no-watch --code-coverage`;
    const testProcess = exec(command, { maxBuffer: 3000000 }, (error, stdout, stderr) => {
      if (error) {
        if (error.message.includes("No inputs were found in config file") ||
          (stdout.includes("Executed 0 of ") && stdout.includes("0 SUCCESS") && !pattern.test(stdout))
        ) {
          console.log(chalk.yellow(`Project ${project}: No tests found.`));
          results.noTests.push(project);
          resolve(`Project ${project}: No tests found.`);
        }
        else if (!pattern.test(stdout) && !stdout.includes("ERROR [karma-server]: Error: Found ")) {
          successAction(stdout, project, ports, results, resolve);
        }
        else {
          let message = `Test results for ${project}:\n${stdout}`;
          message += ` \n\n${error.message}`
          errorLogs.push(chalk.red(message));
          results.failedTests.push(project);
          reject(new Error(`Project ${project}: Error running tests - ${error.message}`));
        }
      }
      else {
        successAction(stdout, project, ports, results, resolve);
      }
    });

    processList.push(testProcess);
  });
}

export async function runAllTests(concurrency, continueOnFailure, projects) {
  const processList = [];
  const ports = [];
  const queue = new PQueue({ concurrency });
  const errorLogs = [];

  const results = {
    noTests: [],
    successfulTests: [],
    failedTests: [],
    unfinishedTests: []
  };

  const testPromises = projects.map(project =>
    queue.add(() => runTests(project, processList, ports, results, errorLogs))
  );

  try {
    if (!continueOnFailure) {
      await Promise.all(testPromises);
    }
    else {
      await Promise.allSettled(testPromises);
    }
  } catch (error) {
    if (!continueOnFailure) {
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
    }
  } finally {

    // Print error logs at the end
    if (errorLogs.length > 0) {
      console.log(chalk.red('\nError Logs:'));
      errorLogs.forEach(log => {
        console.error(log);
        console.log(chalk.bold('----------------------------------------------------------------'));
      });
    }

    // Log the summary
    console.log(chalk.bold('Test Summary:'));

    const noTests = results.noTests.join(', ');
    if (noTests.length > 0) {
      console.log(chalk.yellow(`Projects with no tests: ${noTests}`));
    }

    const successfulTests = results.successfulTests.join(', ');
    if (successfulTests.length > 0) {
      console.log(chalk.green(`Projects with successful tests: ${successfulTests}`));
    }

    const failedTests = results.failedTests.join(', ');
    if (failedTests.length > 0) {
      console.log(chalk.red(`Projects with failed tests: ${failedTests}`));
      if (continueOnFailure) {
        process.exit(1);
      }
    }

    if (!continueOnFailure) {
      console.log(chalk.blue(`Projects with unfinished tests: ${projects.filter(project =>
        !results.noTests.includes(project) &&
        !results.successfulTests.includes(project) &&
        !results.failedTests.includes(project)
      ).join(', ')}`));
    }

    if (!continueOnFailure) {
      queue.clear();
      process.exit(results.failedTests.length > 0 ? 1 : 0);
    }
  }
}

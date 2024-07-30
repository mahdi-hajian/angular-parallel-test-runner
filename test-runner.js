import { exec } from 'child_process';
import PQueue from 'p-queue';
import kill from 'kill-port';

function extractPort(output) {
  const portRegex = /(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)/;
  const match = output.match(portRegex);
  return match ? match[1] : null;
}

function runTests(project, processList, ports) {
  return new Promise((resolve, reject) => {
    const testProcess = exec(`ng test ${project} --no-watch`, (error, stdout, stderr) => {
      if (error) {
        if (error.message.includes("No inputs were found in config file")) {
          console.log(`Project ${project}: No tests found.`);
          resolve(`Project ${project}: No tests found.`);
        } else {
          console.error(`Error running tests for ${project}: ${error.message}`);
          reject(new Error(`Project ${project}: Error running tests - ${error.message}`));
        }
      } else {
        console.log(`Test results for ${project}:\n${stdout}`);
        const port = extractPort(stdout);
        if (port) {
          console.log(`Project ${project} is running on port ${port}`);
          ports.push(port);
        }
        resolve(`Project ${project}: Tests passed successfully.\n${stdout}`);
      }
    });

    processList.push(testProcess);
  });
}

export async function runAllTests(concurrency, projects) {
  const processList = [];
  const ports = [];
  const queue = new PQueue({ concurrency });

  const testPromises = projects.map(project => queue.add(() => runTests(project, processList, ports)));

  try {
    await Promise.all(testPromises);
    console.log('All tests completed successfully');
  } catch (error) {
    console.error('Some tests failed, aborting all tests');
    // Terminate all running processes
    processList.forEach(proc => {
      try {
        if (proc && proc.kill) {
          proc.kill('SIGINT'); // Send SIGINT to allow graceful termination
        }
      } catch (e) {
        console.error(`Failed to kill process: ${e.message}`);
      }
    });

    // Kill all ports
    ports.forEach(port => {
      kill(port)
        .then(() => {
          console.log(`Port ${port} was killed successfully`);
        })
        .catch(err => {
          console.error(`Failed to kill port ${port}: ${err.message}`);
        });
    });

    console.error(error.message);
    // Exit the process with a failure code
    process.exit(1);
  }
}

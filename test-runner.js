import { exec } from 'child_process';
import PQueue from 'p-queue';

function runTests(project, processList) {
  return new Promise((resolve, reject) => {
    const testProcess = exec(`ng test ${project} --no-watch`, (error, stdout, stderr) => {
      if (error) {
        if (error.message.includes("No inputs were found in config file")) {
          console.log(`Project ${project}: No tests found.`);
          resolve(`Project ${project}: No tests found.`);
        } else {
          console.error(`Error running tests for ${project}: ${error.message}`);
          reject(`Project ${project}: Error running tests - ${error.message}`);
        }
      } else {
        console.log(`Test results for ${project}:\n${stdout}`);
        resolve(`Project ${project}: Tests passed successfully.\n${stdout}`);
      }
    });

    processList.push(testProcess);
  });
}

export async function runAllTests(concurrency, projects) {
  const processList = [];
  const queue = new PQueue({ concurrency });

  try {
    const testPromises = projects.map(project => queue.add(() => runTests(project, processList)));
    await Promise.all(testPromises);
    console.log('All tests completed successfully');
  } catch (error) {
    console.error('Some tests failed, aborting all tests');
    processList.forEach(proc => proc.kill());
    console.error(error);
    process.exit(1);
  }
}

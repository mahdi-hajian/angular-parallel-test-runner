const { exec } = require('child_process');

function runTests(project) {
  return new Promise((resolve, reject) => {
    exec(`ng test ${project} --watch=false --browsers=ChromeHeadless`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running tests for ${project}: ${error.message}`);
        reject(error);
      } else {
        console.log(`Test results for ${project}:\n${stdout}`);
        resolve(stdout);
      }
    });
  });
}

async function runAllTests(projects) {
  const testPromises = projects.map(project => runTests(project));
  try {
    const results = await Promise.all(testPromises);
    console.log('All tests completed successfully');
  } catch (error) {
    console.error('Some tests failed');
  }
}

module.exports = runAllTests;

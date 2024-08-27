# Angular Parallel Test Runner

`angular-parallel-test-runner` is a command-line tool designed to run Angular tests in parallel across multiple projects. It utilizes the concurrency capabilities of your machine, maximizing the efficiency of running tests by leveraging multiple CPU cores.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Examples](#examples)
- [How It Works](#how-it-works)
- [Contributing](#contributing)
- [License](#license)

## Installation

To install `angular-parallel-test-runner`, use npm:

```bash
npm install -g angular-parallel-test-runner
```

Make sure to have `concurrently` installed as a dependency if not already:

```bash
npm install concurrently
```

## Usage

To run tests across all Angular projects defined in your `angular.json` file:

```bash
angular-parallel-test-runner [continueOnFailure] [concurrency]
```

### Options

- **`continueOnFailure`**: (Optional) Specifies whether to continue running tests even if some fail. Accepts `true` or `false`. Defaults to `true`.
- **`concurrency`**: (Optional) Specifies the number of concurrent test processes to run. If not provided, defaults to a value based on your system's CPU cores.

### Examples

1. **Run with default settings:**

   ```bash
   angular-parallel-test-runner
   ```

2. **Run with custom concurrency level and continue on failure:**

   ```bash
   angular-parallel-test-runner true 4
   ```

3. **Run with stopping on the first failure and default concurrency:**

   ```bash
   angular-parallel-test-runner false
   ```

## How It Works

1. **Loading Angular Projects**: The tool reads the `angular.json` file in your current directory to determine the list of projects.
2. **Concurrency Management**: It determines the optimal concurrency level based on your CPU cores or a user-provided value.
3. **Test Execution**: Uses `concurrently` to run tests in parallel for each project. If a project has no tests, it skips it gracefully.
4. **Error Handling**: If tests fail and `continueOnFailure` is set to `false`, it stops all tests. Otherwise, it logs errors and proceeds with the remaining tests.
5. **Results Summary**: After execution, the tool provides a summary of test results, including successful tests, failed tests, projects with no tests, and any unfinished tests if the execution is interrupted.

## Contributing

Contributions are welcome! Please check the [repository](https://github.com/mahdi-hajian/angular-parallel-test-runner) for issues to start contributing or feel free to raise new ones.

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/mahdi-hajian/angular-parallel-test-runner/blob/main/LICENSE) file for more information.

---

**Author**: Mahdi Hajian

Feel free to reach out with any questions or suggestions!
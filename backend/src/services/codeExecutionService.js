const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Language configurations
const LANGUAGE_CONFIG = {
  cpp20: {
    extension: 'cpp',
    compile: (file, output) => `g++ -std=c++20 -O2 -o ${output} ${file}`,
    run: (output) => output,
    compileRequired: true,
    timeMultiplier: 1,
    memoryMultiplier: 1
  },
  c: {
    extension: 'c',
    compile: (file, output) => `gcc -std=c17 -O2 -o ${output} ${file}`,
    run: (output) => output,
    compileRequired: true,
    timeMultiplier: 1,
    memoryMultiplier: 1
  },
  java: {
    extension: 'java',
    compile: (file) => `javac ${file}`,
    run: (dir, className) => `java -cp ${dir} ${className}`,
    compileRequired: true,
    timeMultiplier: 2,
    memoryMultiplier: 2,
    className: 'Main' // Expect Main class
  },
  python3: {
    extension: 'py',
    compile: null,
    run: (file) => `python3 ${file}`,
    compileRequired: false,
    timeMultiplier: 3,
    memoryMultiplier: 1.5
  },
  pypy3: {
    extension: 'py',
    compile: null,
    run: (file) => `pypy3 ${file}`,
    compileRequired: false,
    timeMultiplier: 2,
    memoryMultiplier: 2
  }
};

class CodeExecutionService {
  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'codeverse-exec');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Execute code against test cases
   * @param {string} code - Source code
   * @param {string} language - Programming language
   * @param {Array} testCases - Array of { input, expectedOutput }
   * @param {number} timeLimit - Time limit in ms
   * @param {number} memoryLimit - Memory limit in MB
   * @returns {Object} Execution results
   */
  async executeCode(code, language, testCases, timeLimit = 2000, memoryLimit = 256) {
    const langConfig = LANGUAGE_CONFIG[language];
    
    if (!langConfig) {
      return {
        success: false,
        error: `Unsupported language: ${language}`,
        status: 'internal_error'
      };
    }

    const executionId = uuidv4();
    const workDir = path.join(this.tempDir, executionId);
    
    try {
      // Create working directory
      await fs.mkdir(workDir, { recursive: true });

      // Write source code
      const sourceFile = path.join(workDir, `main.${langConfig.extension}`);
      await fs.writeFile(sourceFile, code);

      // Compile if needed
      let executablePath = sourceFile;
      
      if (langConfig.compileRequired) {
        const compileResult = await this.compile(code, language, workDir, sourceFile);
        
        if (!compileResult.success) {
          return {
            success: false,
            status: 'compilation_error',
            compilationError: compileResult.error,
            testCaseResults: []
          };
        }
        
        executablePath = compileResult.executablePath;
      }

      // Adjust time/memory limits based on language
      const adjustedTimeLimit = timeLimit * langConfig.timeMultiplier;
      const adjustedMemoryLimit = memoryLimit * langConfig.memoryMultiplier;

      // Run test cases
      const results = [];
      let allPassed = true;
      let totalTime = 0;
      let maxMemory = 0;
      let testCasesPassed = 0;

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const result = await this.runTestCase(
          executablePath,
          language,
          testCase.input,
          testCase.expectedOutput,
          adjustedTimeLimit,
          adjustedMemoryLimit,
          workDir
        );

        results.push({
          testCaseIndex: i,
          ...result,
          isSample: testCase.isSample
        });

        if (result.passed) {
          testCasesPassed++;
        } else {
          allPassed = false;
        }

        totalTime = Math.max(totalTime, result.executionTime);
        maxMemory = Math.max(maxMemory, result.memoryUsed);
      }

      // Determine overall status
      let status = 'wrong_answer';
      if (allPassed) {
        status = 'accepted';
      } else if (results.some(r => r.status === 'time_limit')) {
        status = 'time_limit';
      } else if (results.some(r => r.status === 'memory_limit')) {
        status = 'memory_limit';
      } else if (results.some(r => r.status === 'runtime_error')) {
        status = 'runtime_error';
      } else if (testCasesPassed > 0) {
        status = 'partial';
      }

      return {
        success: true,
        status,
        testCaseResults: results,
        testCasesPassed,
        totalTestCases: testCases.length,
        totalExecutionTime: totalTime,
        maxMemoryUsed: maxMemory,
        score: Math.round((testCasesPassed / testCases.length) * 100)
      };

    } catch (error) {
      console.error('Code execution error:', error);
      return {
        success: false,
        status: 'internal_error',
        error: error.message,
        testCaseResults: []
      };
    } finally {
      // Cleanup
      this.cleanup(workDir);
    }
  }

  /**
   * Compile source code
   */
  async compile(code, language, workDir, sourceFile) {
    const langConfig = LANGUAGE_CONFIG[language];
    
    return new Promise((resolve) => {
      let command;
      let executablePath;

      if (language === 'java') {
        command = langConfig.compile(sourceFile);
        executablePath = workDir; // For Java, we use the directory
      } else {
        executablePath = path.join(workDir, 'main.out');
        command = langConfig.compile(sourceFile, executablePath);
      }

      exec(command, { timeout: 30000, cwd: workDir }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: stderr || error.message
          });
        } else {
          resolve({
            success: true,
            executablePath,
            output: stdout
          });
        }
      });
    });
  }

  /**
   * Run single test case
   */
  async runTestCase(executablePath, language, input, expectedOutput, timeLimit, memoryLimit, workDir) {
    const langConfig = LANGUAGE_CONFIG[language];
    
    return new Promise((resolve) => {
      let command;
      
      if (language === 'java') {
        command = langConfig.run(workDir, langConfig.className);
      } else if (language === 'python3' || language === 'pypy3') {
        command = langConfig.run(path.join(workDir, `main.${langConfig.extension}`));
      } else {
        command = executablePath;
      }

      const startTime = Date.now();
      const child = spawn('sh', ['-c', command], {
        cwd: workDir,
        timeout: timeLimit
      });

      let stdout = '';
      let stderr = '';
      let memoryUsed = 0;
      let killed = false;

      // Write input
      if (input) {
        child.stdin.write(input);
        child.stdin.end();
      }

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        // Limit output size to prevent memory issues
        if (stdout.length > 1024 * 1024) {
          child.kill();
          killed = true;
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Set timeout
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        killed = true;
      }, timeLimit);

      child.on('close', (code) => {
        clearTimeout(timeout);
        const executionTime = Date.now() - startTime;

        // Normalize output
        const actualOutput = this.normalizeOutput(stdout);
        const expected = this.normalizeOutput(expectedOutput);

        // Check if passed (token comparison)
        const passed = this.compareOutputs(actualOutput, expected);

        let status = 'passed';
        if (killed || executionTime > timeLimit) {
          status = 'time_limit';
        } else if (code !== 0 && code !== null) {
          status = 'runtime_error';
        } else if (!passed) {
          status = 'wrong_answer';
        }

        resolve({
          passed: status === 'passed',
          status,
          executionTime,
          memoryUsed,
          output: stdout.substring(0, 1000), // Limit output size
          error: stderr.substring(0, 500)
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        resolve({
          passed: false,
          status: 'runtime_error',
          executionTime: Date.now() - startTime,
          memoryUsed: 0,
          output: '',
          error: error.message
        });
      });
    });
  }

  /**
   * Normalize output for comparison
   */
  normalizeOutput(output) {
    if (!output) return '';
    return output
      .toString()
      .trim()
      .split('\n')
      .map(line => line.trim())
      .join('\n');
  }

  /**
   * Compare outputs using token comparison
   */
  compareOutputs(actual, expected) {
    // Token comparison - ignore whitespace differences
    const actualTokens = actual.split(/\s+/).filter(t => t);
    const expectedTokens = expected.split(/\s+/).filter(t => t);
    
    if (actualTokens.length !== expectedTokens.length) return false;
    
    for (let i = 0; i < actualTokens.length; i++) {
      if (actualTokens[i] !== expectedTokens[i]) return false;
    }
    
    return true;
  }

  /**
   * Compare outputs for floating point
   */
  compareFloatOutputs(actual, expected, precision = 6) {
    const actualTokens = actual.split(/\s+/).filter(t => t);
    const expectedTokens = expected.split(/\s+/).filter(t => t);
    
    if (actualTokens.length !== expectedTokens.length) return false;
    
    const tolerance = Math.pow(10, -precision);
    
    for (let i = 0; i < actualTokens.length; i++) {
      const actualNum = parseFloat(actualTokens[i]);
      const expectedNum = parseFloat(expectedTokens[i]);
      
      if (isNaN(actualNum) || isNaN(expectedNum)) {
        if (actualTokens[i] !== expectedTokens[i]) return false;
      } else {
        if (Math.abs(actualNum - expectedNum) > tolerance) return false;
      }
    }
    
    return true;
  }

  /**
   * Cleanup temporary files
   */
  async cleanup(dir) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Run code snippet (for live compiler - no test cases)
   */
  async runSnippet(code, language, input = '', timeLimit = 5000) {
    const langConfig = LANGUAGE_CONFIG[language];
    
    if (!langConfig) {
      return {
        success: false,
        error: `Unsupported language: ${language}`
      };
    }

    const executionId = uuidv4();
    const workDir = path.join(this.tempDir, executionId);
    
    try {
      await fs.mkdir(workDir, { recursive: true });

      const sourceFile = path.join(workDir, `main.${langConfig.extension}`);
      await fs.writeFile(sourceFile, code);

      let executablePath = sourceFile;
      
      if (langConfig.compileRequired) {
        const compileResult = await this.compile(code, language, workDir, sourceFile);
        
        if (!compileResult.success) {
          return {
            success: false,
            error: compileResult.error,
            isCompilationError: true
          };
        }
        
        executablePath = compileResult.executablePath;
      }

      const result = await this.runTestCase(
        executablePath,
        language,
        input,
        '', // No expected output for snippet
        timeLimit,
        256,
        workDir
      );

      return {
        success: result.status !== 'runtime_error' && result.status !== 'time_limit',
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        status: result.status
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.cleanup(workDir);
    }
  }
}

module.exports = new CodeExecutionService();

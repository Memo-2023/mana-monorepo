#!/usr/bin/env node

/**
 * Authentication Test Runner
 * CLI script for running authentication tests with detailed reporting and monitoring
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Test configurations
const testSuites = {
  'sign-in': {
    name: 'Sign In Flow Tests',
    path: 'src/__tests__/auth/signInFlow.test.ts',
    description: 'Tests authentication sign-in process including success, failure, and edge cases',
    icon: '🔑',
  },
  'token-refresh': {
    name: 'Token Refresh Flow Tests', 
    path: 'src/__tests__/auth/tokenRefreshFlow.test.ts',
    description: 'Tests token refresh system including race conditions and concurrent requests',
    icon: '🔄',
  },
  'network-errors': {
    name: 'Network Error Handling Tests',
    path: 'src/__tests__/auth/networkErrorHandling.test.ts',
    description: 'Tests network error handling, offline states, and recovery mechanisms',
    icon: '🌐',
  },
  'state-management': {
    name: 'State Management Tests',
    path: 'src/__tests__/auth/stateManagement.test.ts',
    description: 'Tests TokenManager state transitions, AuthContext updates, and observer cleanup',
    icon: '⚙️',
  },
  'supabase-integration': {
    name: 'Supabase Integration Tests',
    path: 'src/__tests__/auth/supabaseIntegration.test.ts',
    description: 'Tests token sync with Supabase client and RLS policy validation',
    icon: '🗄️',
  },
  'all': {
    name: 'All Authentication Tests',
    path: 'src/__tests__/auth/',
    description: 'Run all authentication test suites',
    icon: '🧪',
  },
};

// CLI arguments processing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    suite: 'all',
    watch: false,
    verbose: false,
    coverage: false,
    debug: false,
    help: false,
    silent: false,
    updateSnapshots: false,
    maxWorkers: undefined,
    testTimeout: undefined,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      
      case '-w':
      case '--watch':
        options.watch = true;
        break;
      
      case '-v':
      case '--verbose':
        options.verbose = true;
        break;
      
      case '-c':
      case '--coverage':
        options.coverage = true;
        break;
      
      case '-d':
      case '--debug':
        options.debug = true;
        options.verbose = true;
        break;
      
      case '-s':
      case '--silent':
        options.silent = true;
        break;
      
      case '-u':
      case '--update-snapshots':
        options.updateSnapshots = true;
        break;
      
      case '--max-workers':
        options.maxWorkers = args[++i];
        break;
      
      case '--timeout':
        options.testTimeout = args[++i];
        break;
      
      default:
        if (arg.startsWith('--')) {
          console.error(`${colors.red}Unknown option: ${arg}${colors.reset}`);
          process.exit(1);
        } else {
          options.suite = arg;
        }
        break;
    }
  }
  
  return options;
}

// Display help information
function showHelp() {
  console.log(`
${colors.bright}${colors.cyan}Authentication Test Runner${colors.reset}

${colors.bright}USAGE:${colors.reset}
  npm run test:auth [suite] [options]
  node scripts/run-auth-tests.js [suite] [options]

${colors.bright}AVAILABLE TEST SUITES:${colors.reset}`);

  Object.entries(testSuites).forEach(([key, suite]) => {
    console.log(`  ${colors.yellow}${key.padEnd(18)}${colors.reset} ${suite.icon} ${suite.name}`);
    console.log(`  ${' '.repeat(20)} ${colors.dim}${suite.description}${colors.reset}`);
    console.log('');
  });

  console.log(`${colors.bright}OPTIONS:${colors.reset}
  ${colors.yellow}-h, --help${colors.reset}              Show this help message
  ${colors.yellow}-w, --watch${colors.reset}             Watch for file changes and re-run tests
  ${colors.yellow}-v, --verbose${colors.reset}           Show verbose output
  ${colors.yellow}-c, --coverage${colors.reset}          Generate code coverage report
  ${colors.yellow}-d, --debug${colors.reset}             Enable debug mode with detailed logging
  ${colors.yellow}-s, --silent${colors.reset}            Suppress console output during tests
  ${colors.yellow}-u, --update-snapshots${colors.reset}  Update test snapshots
  ${colors.yellow}--max-workers N${colors.reset}         Set maximum number of worker processes
  ${colors.yellow}--timeout N${colors.reset}             Set test timeout in milliseconds

${colors.bright}EXAMPLES:${colors.reset}
  npm run test:auth                    ${colors.dim}# Run all tests${colors.reset}
  npm run test:auth sign-in           ${colors.dim}# Run sign-in tests only${colors.reset}
  npm run test:auth token-refresh -w  ${colors.dim}# Watch token refresh tests${colors.reset}
  npm run test:auth all -c            ${colors.dim}# Run all tests with coverage${colors.reset}
  npm run test:auth network-errors -d ${colors.dim}# Debug network error tests${colors.reset}

${colors.bright}DEBUGGING UTILITIES:${colors.reset}
  The test suite includes built-in debugging utilities that can be enabled:
  ${colors.cyan}• Token State Inspector${colors.reset}   - Monitor token state transitions
  ${colors.cyan}• Request Queue Monitor${colors.reset}   - Track queued requests during refresh
  ${colors.cyan}• Network Condition Logger${colors.reset} - Log network conditions and errors
  ${colors.cyan}• Auth Flow Visualizer${colors.reset}    - Visualize complete auth flows

  Use ${colors.yellow}-d, --debug${colors.reset} to enable detailed debugging output.
`);
}

// Validate test suite
function validateSuite(suite) {
  if (!testSuites[suite]) {
    console.error(`${colors.red}Error: Unknown test suite "${suite}"${colors.reset}`);
    console.log(`\nAvailable suites: ${Object.keys(testSuites).join(', ')}`);
    process.exit(1);
  }
}

// Build Jest command
function buildJestCommand(options) {
  const jestPath = path.join(__dirname, '../node_modules/.bin/jest');
  const args = [];

  // Test pattern
  if (options.suite === 'all') {
    args.push('src/__tests__/auth/');
  } else {
    args.push(testSuites[options.suite].path);
  }

  // Jest options
  if (options.watch) {
    args.push('--watch');
  }
  
  if (options.verbose) {
    args.push('--verbose');
  }
  
  if (options.coverage) {
    args.push('--coverage');
    args.push('--coverageDirectory=coverage/auth');
    args.push('--collectCoverageFrom=src/services/tokenManager.ts');
    args.push('--collectCoverageFrom=src/services/authService.ts');
    args.push('--collectCoverageFrom=src/context/AuthContext.tsx');
    args.push('--collectCoverageFrom=src/utils/fetchInterceptor.ts');
  }
  
  if (options.silent) {
    args.push('--silent');
  }
  
  if (options.updateSnapshots) {
    args.push('--updateSnapshot');
  }
  
  if (options.maxWorkers) {
    args.push('--maxWorkers', options.maxWorkers);
  }
  
  if (options.testTimeout) {
    args.push('--testTimeout', options.testTimeout);
  }
  
  // Environment variables
  const env = { ...process.env };
  
  if (options.debug) {
    env.DEBUG = 'true';
    env.VERBOSE_TESTS = 'true';
  }

  return { command: jestPath, args, env };
}

// Format test results
function formatResults(exitCode, duration, suite) {
  const suiteInfo = testSuites[suite];
  const status = exitCode === 0 ? 'PASSED' : 'FAILED';
  const statusColor = exitCode === 0 ? colors.green : colors.red;
  const icon = exitCode === 0 ? '✅' : '❌';
  
  console.log(`\n${colors.bright}${colors.cyan}Test Results${colors.reset}`);
  console.log('='.repeat(50));
  console.log(`${colors.bright}Suite:${colors.reset}     ${suiteInfo.icon} ${suiteInfo.name}`);
  console.log(`${colors.bright}Status:${colors.reset}    ${statusColor}${status}${colors.reset} ${icon}`);
  console.log(`${colors.bright}Duration:${colors.reset}  ${Math.round(duration / 1000)}s`);
  console.log('='.repeat(50));
  
  if (exitCode === 0) {
    console.log(`${colors.green}${colors.bright}🎉 All tests passed!${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}💥 Some tests failed. Check the output above for details.${colors.reset}`);
  }
}

// Generate test report
function generateReport(options, results) {
  if (options.silent) return;
  
  const reportDir = path.join(__dirname, '../test-reports');
  
  // Create report directory if it doesn't exist
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `auth-tests-${Date.now()}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    suite: options.suite,
    options,
    results,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };
  
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`${colors.dim}📄 Test report saved to: ${reportPath}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.yellow}Warning: Could not save test report: ${error.message}${colors.reset}`);
  }
}

// Run pre-test checks
function runPreTestChecks() {
  console.log(`${colors.cyan}🔍 Running pre-test checks...${colors.reset}`);
  
  // Check if Jest is installed
  const jestPath = path.join(__dirname, '../node_modules/.bin/jest');
  if (!fs.existsSync(jestPath)) {
    console.error(`${colors.red}Error: Jest not found. Please run 'npm install' first.${colors.reset}`);
    process.exit(1);
  }
  
  // Check if test files exist
  const testDir = path.join(__dirname, '../src/__tests__/auth');
  if (!fs.existsSync(testDir)) {
    console.error(`${colors.red}Error: Test directory not found: ${testDir}${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✅ Pre-test checks passed${colors.reset}\n`);
}

// Main execution function
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }
  
  validateSuite(options.suite);
  
  // Show banner
  console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════╗
║        🧪 Authentication Test Runner      ║
╚══════════════════════════════════════════╝${colors.reset}
`);
  
  runPreTestChecks();
  
  const suiteInfo = testSuites[options.suite];
  console.log(`${colors.bright}Running:${colors.reset} ${suiteInfo.icon} ${suiteInfo.name}`);
  console.log(`${colors.dim}${suiteInfo.description}${colors.reset}\n`);
  
  if (options.debug) {
    console.log(`${colors.yellow}🐛 Debug mode enabled - detailed logging will be shown${colors.reset}`);
    console.log(`${colors.dim}Debugging utilities will be available during test execution${colors.reset}\n`);
  }
  
  if (options.coverage) {
    console.log(`${colors.blue}📊 Coverage reporting enabled${colors.reset}\n`);
  }
  
  // Build and execute Jest command
  const { command, args, env } = buildJestCommand(options);
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env,
      cwd: path.join(__dirname, '..'),
    });
    
    child.on('close', (exitCode) => {
      const duration = Date.now() - startTime;
      
      formatResults(exitCode, duration, options.suite);
      
      // Generate report
      const results = {
        exitCode,
        duration,
        passed: exitCode === 0,
      };
      
      generateReport(options, results);
      
      if (options.coverage && exitCode === 0) {
        console.log(`\n${colors.blue}📊 Coverage report generated in coverage/auth/${colors.reset}`);
        console.log(`${colors.dim}Open coverage/auth/lcov-report/index.html to view detailed coverage${colors.reset}`);
      }
      
      resolve(exitCode);
    });
    
    child.on('error', (error) => {
      console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
      resolve(1);
    });
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Test execution interrupted${colors.reset}`);
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log(`\n${colors.yellow}Test execution terminated${colors.reset}`);
  process.exit(143);
});

// Execute main function
if (require.main === module) {
  main().then((exitCode) => {
    process.exit(exitCode);
  }).catch((error) => {
    console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { main, parseArgs, testSuites };
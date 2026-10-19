const { resolvePythonExecutable } = require('./controllers/bookController');

const resolved = resolvePythonExecutable();
console.log('Resolved Python executable:', resolved);

if (process.platform === 'win32') {
  if (!['py', 'python', 'python3'].includes(resolved)) {
    console.error('Expected a Windows Python command, received:', resolved);
    process.exit(1);
  }
}

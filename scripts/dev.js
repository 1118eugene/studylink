import { spawn } from 'child_process';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function getAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const tryPort = (port) => {
      const server = net.createServer();

      server.once('error', (error) => {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
          tryPort(port + 1);
          return;
        }
        reject(error);
      });

      server.once('listening', () => {
        server.close(() => resolve(port));
      });

      server.listen(port);
    };

    tryPort(startPort);
  });
}

function start(command, args, name, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, FORCE_COLOR: '1', ...extraEnv },
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });

  return child;
}

async function main() {
  const preferredPort = Number(process.env.PORT || 4000);
  const backendPort = await getAvailablePort(preferredPort);
  const proxyTarget = `http://localhost:${backendPort}`;

  console.log(`Starting backend on ${proxyTarget}`);

  const frontend = start(npmCommand, ['run', 'dev:frontend'], 'frontend', {
    VITE_API_PROXY_TARGET: proxyTarget,
  });
  const backend = start(npmCommand, ['run', 'dev:backend'], 'backend', {
    PORT: String(backendPort),
  });

  function shutdown() {
    frontend.kill('SIGTERM');
    backend.kill('SIGTERM');
    process.exit(0);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start development servers:', error);
  process.exit(1);
});

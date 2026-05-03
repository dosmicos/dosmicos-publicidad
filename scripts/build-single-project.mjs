import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const run = (command, args, options = {}) => {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    ...options,
  });
};

const copyDirectory = (from, to) => {
  if (!existsSync(from)) {
    throw new Error(`Missing build output: ${from}`);
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
};

// Build both apps with their own dependency trees so we do not mix React/Vite/Tailwind versions.
run('npm', ['ci', '--prefix', 'apps/publicidad']);
run('npm', ['run', 'build', '--prefix', 'apps/publicidad']);

run('npm', ['ci', '--prefix', 'apps/upload-portal']);
run('npm', ['run', 'build', '--prefix', 'apps/upload-portal'], {
  env: {
    ...process.env,
    VITE_BASE_PATH: '/upload/',
  },
});

// Compose a single deployable Vercel output:
// - / serves apps/publicidad
// - /upload/* serves apps/upload-portal
rmSync('dist', { recursive: true, force: true });
copyDirectory('apps/publicidad/dist', 'dist');
copyDirectory('apps/upload-portal/dist', 'dist/upload');

console.log('\nSingle-project output ready in ./dist');

import { execSync } from 'node:child_process';
import { platform, homedir } from 'node:os';
import { join } from 'node:path';
import { accessSync, constants, mkdirSync, writeFileSync } from 'node:fs';

export function run(cmd, opts = {}) {
  const { silent = true, ignoreError = false, env = {} } = opts;
  try {
    return execSync(cmd, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      env: { ...process.env, ...env },
      ...opts,
    });
  } catch (err) {
    if (ignoreError) return '';
    throw err;
  }
}

export function runStream(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'inherit', encoding: 'utf-8', ...opts });
}

export function which(bin) {
  try {
    execSync(`${platform() === 'win32' ? 'where' : 'which'} ${bin}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return true;
  } catch {
    return false;
  }
}

export function isLinux() {
  return platform() === 'linux';
}

export function isMacOS() {
  return platform() === 'darwin';
}

export function isWindows() {
  return platform() === 'win32';
}

export function openclawBin() {
  return which('openclaw') ? 'openclaw' : 'npx openclaw';
}

export function dropinDir() {
  return join(homedir(), '.config/systemd/user/openclaw-gateway.service.d');
}

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

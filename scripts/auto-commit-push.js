import chokidar from 'chokidar';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const pendingPaths = new Set();
const debounceMs = 1200;
let timer;
let syncing = false;

function runGit(args) {
  return execFileAsync('git', args, { cwd: root, windowsHide: true });
}

async function isIgnored(filePath) {
  try {
    await runGit(['check-ignore', '-q', '--', filePath]);
    return true;
  } catch (error) {
    if (error.code === 1) return false;
    throw error;
  }
}

async function syncChanges() {
  if (syncing || pendingPaths.size === 0) return;
  syncing = true;
  const changedPaths = [...pendingPaths];
  pendingPaths.clear();

  try {
    const paths = [];
    for (const filePath of changedPaths) {
      if (!(await isIgnored(filePath))) paths.push(filePath);
    }
    if (paths.length === 0) return;

    await runGit(['add', '-A', '--', ...paths]);
    try {
      await runGit(['diff', '--cached', '--quiet', '--', ...paths]);
      return;
    } catch (error) {
      if (error.code !== 1) throw error;
    }

    const subject = paths.length === 1
      ? `Auto-save ${paths[0]}`
      : `Auto-save ${paths.length} files`;
    await runGit(['commit', '--only', '-m', subject, '--', ...paths]);
    console.log(`Committed ${paths.length} saved file${paths.length === 1 ? '' : 's'}.`);
    await runGit(['push']);
    console.log('Changes pushed to the current upstream branch.');
  } catch (error) {
    console.error('Auto-sync failed. Check Git status and push access, then save a file to retry.');
  } finally {
    syncing = false;
    if (pendingPaths.size > 0) scheduleSync();
  }
}

function scheduleSync() {
  clearTimeout(timer);
  timer = setTimeout(syncChanges, debounceMs);
}

const watcher = chokidar.watch('.', {
  cwd: root,
  ignored: /(^|[/\\])(?:\.git|node_modules|dist)([/\\]|$)/,
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 }
});

watcher.on('all', (event, filePath) => {
  if (event.endsWith('Dir')) return;
  pendingPaths.add(filePath);
  scheduleSync();
});
watcher.on('ready', () => {
  console.log(`Auto-commit watcher active (debounce ${debounceMs} ms).`);
});
watcher.on('error', () => {
  console.error('Auto-commit watcher encountered a filesystem error.');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await watcher.close();
    console.log('Auto-commit watcher stopped.');
    process.exit(0);
  });
}

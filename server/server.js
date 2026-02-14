const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { parseCucumberJson, parseJunitXml } = require('./parsers');

const app = express();
const PORT = process.env.PORT || 8080;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// In-memory log storage (per run)
const runLogs = new Map();

function addLog(runId, line) {
  if (!runLogs.has(runId)) runLogs.set(runId, []);
  const logs = runLogs.get(runId);
  logs.push(`[${new Date().toISOString()}] ${line}`);
  if (logs.length > 5000) logs.splice(0, logs.length - 5000);
}

// ─── GET /api/projects ──────────────────────────────────
app.get('/api/projects', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM projects').all();
    const projects = rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') }));
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/runs ──────────────────────────────────────
app.get('/api/runs', (req, res) => {
  try {
    let rows;
    if (req.query.projectId) {
      rows = db.prepare('SELECT * FROM runs WHERE projectId = ? ORDER BY timestamp DESC LIMIT 50')
        .all(req.query.projectId);
    } else {
      rows = db.prepare('SELECT * FROM runs ORDER BY timestamp DESC LIMIT 50').all();
    }
    const runs = rows.map(r => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      summary: JSON.parse(r.summary || '{}'),
    }));
    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/runs/:runId ───────────────────────────────
app.get('/api/runs/:runId', (req, res) => {
  try {
    const run = db.prepare('SELECT * FROM runs WHERE id = ?').get(req.params.runId);
    if (!run) return res.status(404).json({ error: 'Run not found' });

    const featureRows = db.prepare('SELECT * FROM features WHERE runId = ?').all(req.params.runId);
    const features = featureRows.map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      scenarios: JSON.parse(f.scenarios || '[]'),
    }));

    res.json({
      ...run,
      tags: JSON.parse(run.tags || '[]'),
      summary: JSON.parse(run.summary || '{}'),
      features,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/runs/:runId/logs ──────────────────────────
app.get('/api/runs/:runId/logs', (req, res) => {
  const logs = runLogs.get(req.params.runId) || [];
  const offset = parseInt(req.query.offset) || 0;
  res.json({ logs: logs.slice(offset), total: logs.length });
});

// ─── POST /api/runs ─────────────────────────────────────
app.post('/api/runs', (req, res) => {
  try {
    const { projectId, repo, tags = [], branch = 'main', makeTarget = 'test-acceptance' } = req.body;

    if (!projectId || !repo) {
      return res.status(400).json({ error: 'projectId and repo are required' });
    }

    const runId = uuidv4();
    const timestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO runs (id, projectId, repo, tags, branch, makeTarget, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(runId, projectId, repo, JSON.stringify(tags), branch, makeTarget, timestamp);

    res.json({ runId, status: 'pending' });

    // Run async
    executeRun(runId, { projectId, repo, tags, branch, makeTarget }).catch(err => {
      console.error(`Run ${runId} failed:`, err);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/seed ─────────────────────────────────────
app.post('/api/seed', (req, res) => {
  try {
    require('./seed');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function executeRun(runId, { projectId, repo, tags, branch, makeTarget }) {
  const workDir = `/tmp/runs/${runId}`;
  const startTime = Date.now();

  try {
    db.prepare('UPDATE runs SET status = ? WHERE id = ?').run('running', runId);
    addLog(runId, `Starting test run for ${repo} on branch ${branch}`);

    fs.mkdirSync(workDir, { recursive: true });
    const cloneUrl = GITHUB_TOKEN
      ? `https://${GITHUB_TOKEN}@github.com/${repo}.git`
      : `https://github.com/${repo}.git`;
    
    addLog(runId, `Cloning ${repo}...`);
    try {
      execSync(`git clone --depth 1 --branch ${branch} ${cloneUrl} ${workDir}/repo`, {
        timeout: 120000,
        stdio: 'pipe',
      });
    } catch (cloneErr) {
      addLog(runId, `Clone failed: ${cloneErr.stderr?.toString() || cloneErr.message}`);
      throw new Error(`Failed to clone repository: ${cloneErr.message}`);
    }
    addLog(runId, 'Clone complete');

    const repoDir = path.join(workDir, 'repo');

    if (!fs.existsSync(path.join(repoDir, 'Makefile'))) {
      throw new Error('No Makefile found in repository root');
    }

    try {
      execSync(`make -n ${makeTarget}`, { cwd: repoDir, stdio: 'pipe' });
    } catch {
      throw new Error(`Make target '${makeTarget}' does not exist in this repository`);
    }

    let cmd = `make ${makeTarget}`;
    if (tags.length > 0) {
      cmd += ` TAGS="${tags.join(' and ')}"`;
    }
    addLog(runId, `Running: ${cmd}`);

    const child = spawn('bash', ['-c', cmd], {
      cwd: repoDir,
      env: { ...process.env, GITHUB_TOKEN },
      timeout: 3600000,
    });

    child.stdout.on('data', (data) => addLog(runId, data.toString().trim()));
    child.stderr.on('data', (data) => addLog(runId, `[stderr] ${data.toString().trim()}`));

    const exitCode = await new Promise((resolve) => {
      child.on('close', resolve);
      child.on('error', (err) => { addLog(runId, `Process error: ${err.message}`); resolve(1); });
    });

    addLog(runId, `Tests finished with exit code ${exitCode}`);

    let features = [];
    let summary = { passed: 0, failed: 0, skipped: 0, total: 0 };

    // Try Cucumber JSON
    const cucumberFiles = findFiles(repoDir, '.json', ['node_modules', '.git'])
      .filter(f => {
        try {
          const c = JSON.parse(fs.readFileSync(f, 'utf8'));
          return Array.isArray(c) && c[0]?.elements;
        } catch { return false; }
      });

    if (cucumberFiles.length > 0) {
      addLog(runId, `Found Cucumber JSON: ${cucumberFiles[0]}`);
      const parsed = parseCucumberJson(JSON.parse(fs.readFileSync(cucumberFiles[0], 'utf8')));
      features = parsed.features;
      summary = parsed.summary;
    } else {
      // Try JUnit XML
      const junitFiles = findFiles(repoDir, '.xml', ['node_modules', '.git'])
        .filter(f => {
          try { return fs.readFileSync(f, 'utf8').includes('<testsuite'); } catch { return false; }
        });

      if (junitFiles.length > 0) {
        addLog(runId, `Found JUnit XML: ${junitFiles[0]}`);
        const parsed = parseJunitXml(fs.readFileSync(junitFiles[0], 'utf8'));
        features = parsed.features;
        summary = parsed.summary;
      } else {
        addLog(runId, 'No parseable result files found, using exit code');
        summary = exitCode === 0
          ? { passed: 1, failed: 0, skipped: 0, total: 1 }
          : { passed: 0, failed: 1, skipped: 0, total: 1 };
        features = [{
          name: 'Test Execution',
          description: exitCode === 0 ? 'Tests passed' : 'Tests failed',
          scenarios: [{ name: makeTarget, status: exitCode === 0 ? 'passed' : 'failed', steps: [], tags, duration: Date.now() - startTime }],
        }];
      }
    }

    const duration = Date.now() - startTime;
    const status = summary.failed > 0 ? 'failed' : 'passed';

    // Store features
    const insertFeature = db.prepare('INSERT INTO features (runId, name, description, scenarios) VALUES (?, ?, ?, ?)');
    const storeTx = db.transaction(() => {
      for (const f of features) {
        insertFeature.run(runId, f.name, f.description || '', JSON.stringify(f.scenarios || []));
      }
    });
    storeTx();

    db.prepare('UPDATE runs SET status = ?, duration = ?, summary = ?, completedAt = ? WHERE id = ?')
      .run(status, duration, JSON.stringify(summary), new Date().toISOString(), runId);

    addLog(runId, `Run complete: ${status} (${summary.passed}/${summary.total} passed)`);

  } catch (err) {
    const duration = Date.now() - startTime;
    addLog(runId, `Error: ${err.message}`);
    db.prepare('UPDATE runs SET status = ?, duration = ?, error = ?, completedAt = ? WHERE id = ?')
      .run('failed', duration, err.message, new Date().toISOString(), runId);
  } finally {
    try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
    setTimeout(() => runLogs.delete(runId), 3600000);
  }
}

function findFiles(dir, ext, excludeDirs = []) {
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (excludeDirs.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...findFiles(fullPath, ext, excludeDirs));
      else if (entry.name.endsWith(ext)) results.push(fullPath);
    }
  } catch {}
  return results;
}

app.listen(PORT, () => {
  console.log(`BDD Test Runner server on port ${PORT}`);
});

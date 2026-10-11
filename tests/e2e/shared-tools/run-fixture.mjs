/**
 * Runs one website fixture: the tests for a single Gherkin feature.
 * Cookies, persona sessions, and chain.json live in tests/e2e/shared-session.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { loadLoginsEnv } from './logins.mjs';
import { applyDataSet, applyPack, clearRunState, loadRunConfig, sharedSessionDir } from './run-config.mjs';
import { normalizeToken } from '../web/utils/helpers.mjs';
import {
  beginScenario,
  configureRecording,
  finishRun,
  finishScenario,
} from './recording.mjs';

export async function runFixture({ fixtureDir, featureId, testFiles }) {
  const webDir = path.resolve(fixtureDir, '../..');
  const e2eRoot = path.resolve(webDir, '..');
  const runStateDir = sharedSessionDir(e2eRoot);
  const chainPath = path.join(runStateDir, 'chain.json');
  const testsDir = path.join(webDir, 'tests');
  loadLoginsEnv();

  let runConfig;
  try {
    runConfig = loadRunConfig(fixtureDir, process.argv.slice(2));
    for (const id of runConfig.rest) {
      const known = testFiles.some((fileName) => fileName.replace(/\.mjs$/, '') === id);
      if (!known) throw new Error(`Unknown scenario ${id}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  applyDataSet(runConfig);

  const selected = new Set(runConfig.rest);
  const files = selected.size > 0
    ? testFiles.filter((fileName) => selected.has(fileName.replace(/\.mjs$/, '')))
    : testFiles;

  fs.mkdirSync(runStateDir, { recursive: true });
  let chain = {};
  if (runConfig.baseState !== 'none') {
    try {
      await applyPack(e2eRoot, runConfig.baseState);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
    fs.rmSync(chainPath, { force: true });
  } else if (fs.existsSync(chainPath)) {
    chain = JSON.parse(fs.readFileSync(chainPath, 'utf8'));
  }

  const modules = [];
  for (const fileName of files) {
    const imported = await import(pathToFileURL(path.join(testsDir, fileName)).href);
    if (!imported.id || typeof imported.run !== 'function') {
      throw new Error(`${fileName} must export id and run`);
    }
    modules.push(imported);
  }

  const runDir = configureRecording(runConfig.video);
  if (runDir) console.log(`Recording videos (${runConfig.video}) to ${runDir}`);
  beginScenario(featureId);

  let failed = false;
  for (const imported of modules) {
    try {
      await imported.run({
        chain,
        provide(name, value) {
          chain[normalizeToken(name)] = value;
          saveChain(runStateDir, chainPath, chain);
        },
      });
      console.log(`PASS ${imported.id}`);
    } catch (error) {
      console.error(`FAIL ${imported.id}`);
      console.error(error.message);
      failed = true;
      break;
    }
  }

  finishScenario(!failed);
  const kept = finishRun();
  if (runConfig.video !== 'none') {
    console.log(kept ? `Recordings kept in ${kept}` : 'No recordings kept.');
  }
  if (!failed && runConfig.clearSession) clearRunState(runStateDir);
  process.exit(failed ? 1 : 0);
}

function saveChain(runStateDir, chainPath, chain) {
  if (Object.keys(chain).length === 0) return;
  fs.mkdirSync(runStateDir, { recursive: true });
  fs.writeFileSync(chainPath, `${JSON.stringify(chain, null, 2)}\n`);
}

/**
 * Website smoke fixture entry point.
 * Loads the tests under web/tests that belong to this fixture.
 * Order comes from scenario contracts on the capability feature pages.
 * A scenario checks prerequisites first and does not run its own page calls when they are missing.
 * Database, form data, video, and session cleanup come from run-config.yaml.
 * Command-line flags override that file. baseState none leaves the database as it is.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';
import { loadLoginsEnv } from '../../../shared-tools/logins.mjs';
import { applyDataSet, applyPack, clearRunState, loadRunConfig } from '../../../shared-tools/run-config.mjs';
import { normalizeRef, normalizeToken } from '../../utils/helpers.mjs';
import { beginScenario, configureRecording, finishRun, finishScenario } from '../../../shared-tools/recording.mjs';

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(fixtureDir, '../..');
const e2eRoot = path.resolve(webDir, '..');
const repoRoot = path.resolve(webDir, '../../..');
const featuresDir = path.join(repoRoot, 'docs', 'capabilities', 'features');
const runStateDir = path.join(fixtureDir, 'run-state');
const chainPath = path.join(runStateDir, 'chain.json');
const testsDir = path.join(webDir, 'tests');

loadLoginsEnv();

function parseSimpleYaml(source) {
  const root = {};
  const stack = [{ indent: -1, container: root, key: null }];
  for (const raw of source.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const indent = raw.match(/^ */)[0].length;
    const line = raw.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const frame = stack[stack.length - 1];
    if (line.startsWith('- ')) {
      const item = line.slice(2).trim();
      if (!Array.isArray(frame.container[frame.key])) frame.container[frame.key] = [];
      const objectItem = item.match(/^([A-Za-z0-9_-]+):\s+(.*)$/);
      if (objectItem) {
        const obj = {};
        obj[objectItem[1]] = coerce(objectItem[2]);
        frame.container[frame.key].push(obj);
        stack.push({ indent, container: obj, key: objectItem[1] });
      } else {
        frame.container[frame.key].push(coerce(item));
      }
      continue;
    }
    const [key, value] = splitKey(line);
    if (value === '') {
      frame.container[key] = {};
      stack.push({ indent, container: frame.container, key });
    } else {
      frame.container[key] = coerce(value);
    }
  }
  return root;
}

function splitKey(line) {
  const index = line.indexOf(':');
  return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
}

function coerce(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === '[]') return [];
  if (/^\d+$/.test(value)) return Number(value);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function contractsFromMarkdown(markdown) {
  const rolesMatch = markdown.match(/^roles:\s*\[([^\]]*)\]/m);
  const roles = rolesMatch
    ? rolesMatch[1].split(',').map((role) => role.trim()).filter(Boolean)
    : [];
  const contracts = [];
  for (const match of markdown.matchAll(/```yaml\r?\n([\s\S]*?)```/g)) {
    const parsed = parseSimpleYaml(match[1]);
    const listed = Array.isArray(parsed.scenarios) ? parsed.scenarios : parsed.id ? [parsed] : [];
    for (const contract of listed) {
      contracts.push({
        ...contract,
        requires: contract.requires || [],
        provides: contract.provides || [],
        roles,
      });
    }
  }
  return contracts;
}

function loadContracts() {
  const contracts = [];
  for (const fileName of fs.readdirSync(featuresDir).filter((name) => name.endsWith('.md'))) {
    const markdown = fs.readFileSync(path.join(featuresDir, fileName), 'utf8');
    contracts.push(...contractsFromMarkdown(markdown));
  }
  return contracts;
}

function loadChain() {
  if (!fs.existsSync(chainPath)) return {};
  return JSON.parse(fs.readFileSync(chainPath, 'utf8'));
}

function saveChain(chain) {
  fs.mkdirSync(runStateDir, { recursive: true });
  fs.writeFileSync(chainPath, `${JSON.stringify(chain, null, 2)}\n`);
}

function scenarioKey(id, instance = 1) {
  return instance === 1 ? id : `${id}[${instance}]`;
}

function sortReady(ready, byId) {
  return [...ready].sort((a, b) => (byId.get(a).sequence ?? 0) - (byId.get(b).sequence ?? 0));
}

function executionOrder(contracts) {
  const byId = new Map(contracts.map((contract) => [contract.id, contract]));
  const incoming = new Map(contracts.map((contract) => [contract.id, 0]));
  const dependents = new Map(contracts.map((contract) => [contract.id, []]));
  for (const contract of contracts) {
    for (const requirement of contract.requires) {
      const { id } = normalizeRef(requirement);
      if (!byId.has(id)) {
        throw new Error(`${contract.id} requires unknown scenario ${requirement}`);
      }
      incoming.set(contract.id, incoming.get(contract.id) + 1);
      dependents.get(id).push(contract.id);
    }
  }
  const ready = contracts.filter((contract) => incoming.get(contract.id) === 0).map((contract) => contract.id);
  const order = [];
  while (ready.length > 0) {
    const next = sortReady(ready, byId)[0];
    ready.splice(ready.indexOf(next), 1);
    order.push(byId.get(next));
    for (const dependent of dependents.get(next)) {
      incoming.set(dependent, incoming.get(dependent) - 1);
      if (incoming.get(dependent) === 0) ready.push(dependent);
    }
  }
  if (order.length !== contracts.length) {
    throw new Error('Scenario requirements contain a cycle');
  }
  return order;
}

function missingPrerequisites(contract, chainState, passed, allowExistingTokens) {
  const missing = [];
  for (const requirement of contract.requires) {
    const { id, instance } = normalizeRef(requirement);
    const key = scenarioKey(id, instance);
    if (!passed.has(key)) {
      if (!allowExistingTokens) {
        missing.push(requirement);
        continue;
      }
      const provider = smokeContracts.find((item) => item.id === id);
      const absent = tokensPresent(provider, chainState, instance);
      if (!provider || provider.provides.length === 0 || absent.length > 0) {
        missing.push(...(absent.length > 0 ? absent : [requirement]));
      }
      continue;
    }
    const provider = passed.get(key);
    missing.push(...tokensPresent(provider, chainState, instance));
  }
  return missing;
}

let runConfig;
try {
  runConfig = loadRunConfig(fixtureDir, process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
applyDataSet(runConfig);
const videoMode = runConfig.video;
const selected = runConfig.rest;
const fixtureTests = [
  'public.cookie-consent.visitor-accepts.mjs',
  'public.content.visitor-browses.mjs',
  'auth.session-continuity.rejected-cache-returns-to-sign-in.mjs',
  'event.eventadmin.createandconfigure-scenario1.mjs',
  'group.groupadmin.createandconfigure-scenario1.mjs',
  'registration.groupadmin.registerforevent-scenario1.mjs',
  'registration.groupadmin.checkregistrationandedit-scenario1.mjs',
];
const widerOnly = new Set(['auth.session-continuity.rejected-cache-returns-to-sign-in']);
const contracts = loadContracts();
const modules = new Map();
for (const fileName of fixtureTests) {
  const imported = await import(pathToFileURL(path.join(testsDir, fileName)).href);
  if (!imported.id || typeof imported.run !== 'function') {
    throw new Error(`${fileName} must export id and run`);
  }
  modules.set(imported.id, imported);
}

const smokeContracts = contracts.filter((contract) => !contract.coveredBy && modules.has(contract.id));
for (const [id, imported] of modules) {
  const contract = contracts.find((item) => item.id === id);
  if (!contract) throw new Error(`${id} has no scenario contract on a feature page`);
  if (contract.persona && !contract.roles.includes(contract.persona)) {
    throw new Error(`${id} persona ${contract.persona} is not in the feature roles`);
  }
  modules.set(id, { ...imported, contract });
}

let planned = executionOrder(smokeContracts);
if (selected.length > 0) {
  for (const id of selected) {
    if (!smokeContracts.some((item) => item.id === id)) throw new Error(`Unknown scenario ${id}`);
  }
  planned = planned.filter((contract) => selected.includes(contract.id));
} else {
  planned = planned.filter((contract) => !widerOnly.has(contract.id));
}

if (runConfig.baseState !== 'none') {
  try {
    await applyPack(e2eRoot, runConfig.baseState);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  fs.rmSync(chainPath, { force: true });
}

fs.mkdirSync(runStateDir, { recursive: true });
const runDir = configureRecording(videoMode);
if (runDir) console.log(`Recording videos (${videoMode}) to ${runDir}`);
let chain = loadChain();
const passed = new Map();
let failed = false;

function tokensPresent(provider, chainState, instance) {
  if (!provider || provider.provides.length === 0) return [];
  const absent = [];
  for (const token of provider.provides) {
    const named = normalizeToken(token);
    const instanceToken = named.replace(/\[\d+\]$/, `[${instance}]`);
    if (!Object.prototype.hasOwnProperty.call(chainState, instanceToken) && !Object.prototype.hasOwnProperty.call(chainState, named)) {
      absent.push(token);
    }
  }
  return absent;
}

for (const contract of planned) {
  const missing = missingPrerequisites(contract, chain, passed, selected.length > 0);
  if (missing.length > 0) {
    console.error(`FAIL ${contract.id}`);
    console.error(`prerequisites not available: ${missing.join(', ')}`);
    failed = true;
    continue;
  }
  beginScenario(contract.id);
  try {
    const imported = modules.get(contract.id);
    await imported.run({
      chain,
      provide(name, value) {
        chain[normalizeToken(name)] = value;
        saveChain(chain);
      },
    });
    for (const token of contract.provides) {
      const key = normalizeToken(token);
      if (!Object.prototype.hasOwnProperty.call(chain, key)) {
        chain[key] = 'ready';
        saveChain(chain);
      }
    }
    passed.set(contract.id, contract);
    passed.set(scenarioKey(contract.id, 1), contract);
    chain[`done:${contract.id}`] = true;
    saveChain(chain);
    finishScenario(true);
    console.log(`PASS ${contract.id}`);
  } catch (error) {
    finishScenario(false);
    console.error(`FAIL ${contract.id}`);
    console.error(error.message);
    failed = true;
  }
}

const kept = finishRun();
if (videoMode !== 'none') {
  console.log(kept ? `Recordings kept in ${kept}` : 'No recordings kept.');
}

if (!failed && runConfig.clearSession) clearRunState(runStateDir);

process.exit(failed ? 1 : 0);

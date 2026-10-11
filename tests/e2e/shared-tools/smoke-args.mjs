/**
 * Flags a smoke runner forwards to each fixture.
 * --base-state and --clear-session belong to the smoke runner, so they are dropped.
 * --video, --event-data, and --group-data keep the following value.
 */
const stripFlags = new Set(['--base-state', '--clear-session']);
const valueFlags = new Set(['--video', '--event-data', '--group-data']);

export function forwardedSmokeArgs(argv, suiteDir) {
  const forwarded = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      throw new Error(`Run one feature with node ${suiteDir}/fixtures/<feature>/run.mjs. Unexpected ${arg}`);
    }
    const equals = arg.indexOf('=');
    const flag = equals === -1 ? arg : arg.slice(0, equals);
    if (stripFlags.has(flag)) {
      if (equals === -1) index += 1;
      continue;
    }
    if (valueFlags.has(flag) && equals === -1) {
      const value = argv[index + 1];
      if (value == null || value === '' || value.startsWith('--')) {
        throw new Error(`${flag} needs a value`);
      }
      forwarded.push(flag, value);
      index += 1;
      continue;
    }
    forwarded.push(arg);
  }
  return forwarded;
}

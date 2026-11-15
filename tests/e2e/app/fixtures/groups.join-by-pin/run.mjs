/**
 * App fixture entry point for joining a group with its member pin.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { runAppFeature } from '../../run-feature.mjs';

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));

await runAppFeature({
  fixtureDir,
  featureId: 'groups.join-by-pin',
  clipLabel: 'join-by-pin',
  testFiles: [
    'groups.group-member.sees-current-group.mjs',
    'groups.group-member.rejects-unknown-pin.mjs',
    'groups.group-member.joins-second-group.mjs',
  ],
});

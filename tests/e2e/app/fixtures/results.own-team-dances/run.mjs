/**
 * App fixture entry point for a group member viewing their teams' dances.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { runAppFeature } from '../../run-feature.mjs';

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));

await runAppFeature({
  fixtureDir,
  featureId: 'results.own-team-dances',
  clipLabel: 'own-team-dances',
  testFiles: [
    'results.group-member.sees-own-team-dance.mjs',
    'results.group-member.hides-unpublished-results.mjs',
    'results.group-member.sees-joined-groups-dances.mjs',
  ],
});

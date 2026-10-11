import path from 'path';
import { fileURLToPath } from 'url';
import { runFixture } from '../../../shared-tools/run-fixture.mjs';

await runFixture({
  fixtureDir: path.dirname(fileURLToPath(import.meta.url)),
  featureId: 'auth.session-continuity',
  testFiles: ['auth.session-continuity.rejected-cache-returns-to-sign-in.mjs'],
});

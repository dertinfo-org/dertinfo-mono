import path from 'path';
import { fileURLToPath } from 'url';
import { runFixture } from '../../../shared-tools/run-fixture.mjs';

await runFixture({
  fixtureDir: path.dirname(fileURLToPath(import.meta.url)),
  featureId: 'public.cookie-consent',
  testFiles: ['public.cookie-consent.visitor-accepts.mjs'],
});

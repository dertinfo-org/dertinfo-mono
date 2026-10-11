import { withSmokePage } from '../utils/helpers.mjs';
import { PublicContentPage } from '../pages/public-content.mjs';

export const id = 'public.content.visitor-browses';

export async function run() {
  await withSmokePage(async (page) => {
    const content = new PublicContentPage(page);
    await content.browse();
  }, { cookies: true });
}

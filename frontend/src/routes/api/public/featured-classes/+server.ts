import { json } from '@sveltejs/kit';
import { getFeaturedClasses } from '$lib/server/publicData';

export async function GET() {
  return json({ classes: await getFeaturedClasses() }, {
    headers: {
      'cache-control': 'no-store'
    }
  });
}

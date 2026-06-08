import { json } from '@sveltejs/kit';
import { getPublicStats } from '$lib/server/publicData';

export async function GET() {
  return json(await getPublicStats(), {
    headers: {
      'cache-control': 'no-store'
    }
  });
}

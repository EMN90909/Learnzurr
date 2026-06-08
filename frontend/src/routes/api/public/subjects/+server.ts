import { json } from '@sveltejs/kit';
import { getPublicSubjects } from '$lib/server/publicData';

export async function GET() {
  return json({ subjects: await getPublicSubjects() }, {
    headers: {
      'cache-control': 'public, max-age=120'
    }
  });
}

import { put } from '@vercel/blob';

export async function POST(request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: 'Image upload not configured' }, { status: 503 });
  }
  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
  const file = form.get('file');
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });
  if (!file.type?.startsWith('image/')) {
    return Response.json({ error: 'Only image files allowed' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: 'Image must be under 5 MB' }, { status: 400 });
  }
  const blob = await put(`recipes/${Date.now()}-${file.name}`, file, { access: 'public' });
  return Response.json({ url: blob.url });
}

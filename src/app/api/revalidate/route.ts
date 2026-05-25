import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { secret, path } = await request.json();

    // Lấy secret từ file .env.local
    const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'truongtin_secret_2024';

    if (secret !== REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid secret token' }, { status: 401 });
    }

    if (!path) {
      return NextResponse.json({ message: 'Path parameter is required' }, { status: 400 });
    }

    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path, now: Date.now() });
  } catch (err) {
    console.error("Lỗi khi revalidate:", err);
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}

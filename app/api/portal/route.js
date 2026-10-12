import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'Требуется вход в систему.' }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return NextResponse.json({ error: 'Авторизация не настроена на сервере.' }, { status: 503 });

  const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData?.user) return NextResponse.json({ error: 'Сессия истекла. Войдите снова.' }, { status: 401 });

  // Role is read server-side with the service key; the browser cannot grant itself a role.
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile, error: profileError } = await admin.from('portal_users').select('role, active').eq('user_id', authData.user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: 'Не удалось проверить права доступа.' }, { status: 500 });
  if (!profile || profile.active !== true || !['employee', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Учётная запись не активирована. Обратитесь к администратору.' }, { status: 403 });
  }

  try {
    const html = await readFile(path.join(process.cwd(), 'private', 'portal.html'), 'utf8');
    return new Response(html, { status: 200, headers: {
      'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY'
    }});
  } catch {
    return NextResponse.json({ error: 'Файл учебного портала не найден на сервере.' }, { status: 500 });
  }
}

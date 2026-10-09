import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile, error: profileError } = await admin.from('portal_users').select('role, active').eq('user_id', data.user.id).maybeSingle();
  if (profileError || !profile || profile.active !== true) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ id: data.user.id, email: data.user.email, role: profile.role });
}

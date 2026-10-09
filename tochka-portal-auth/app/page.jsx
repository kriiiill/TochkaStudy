'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let supabase;
if (url && anon) supabase = createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Введите корпоративный логин и пароль, выданные администратором.');

  async function enter(session) {
    if (!session?.access_token) return;
    const response = await fetch('/api/portal', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Нет доступа к порталу. Обратитесь к администратору.');
    }
    const html = await response.text();
    // The full portal HTML is returned only after the server validates the user's session and active role.
    document.open(); document.write(html); document.close();
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) enter(data.session).catch(async e => { setError(e.message); await supabase.auth.signOut(); });
    });
  }, []);

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (!supabase) throw new Error('Портал ещё не настроен: добавьте переменные Supabase в Vercel.');
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error('Не удалось войти. Проверьте логин и пароль или обратитесь к администратору.');
      await enter(data.session);
    } catch (e) { setError(e.message || 'Ошибка входа. Попробуйте ещё раз.'); }
    finally { setBusy(false); }
  }

  return <main className="login-wrap"><section className="login-card">
    <div className="brand-mark" aria-hidden="true"><span>ТС</span></div>
    <p className="eyebrow">ТОЧКА СВЯЗИ</p><h1>Учебный портал</h1>
    <p className="sub">Вход для сотрудников</p>
    <form onSubmit={submit}>
      <label htmlFor="email">Логин</label><input id="email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Рабочий логин" required />
      <label htmlFor="password">Пароль</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Введите пароль" required />
      {error && <p className="error" role="alert">{error}</p>}
      <button disabled={busy} type="submit">{busy ? 'Проверяем доступ…' : 'Войти в портал'}</button>
    </form>
    <p className="help">{message}</p><p className="foot">Доступ предоставляется администратором компании.</p>
  </section></main>;
}

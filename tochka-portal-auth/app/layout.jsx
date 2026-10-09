import './style.css';
export const metadata = { title: 'Точка Связи — Учебный портал', description: 'Внутренний учебный портал сотрудников «Точка Связи»' };
export default function RootLayout({ children }) {
  return <html lang="ru"><body>{children}</body></html>;
}

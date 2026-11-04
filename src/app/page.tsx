import { redirect } from 'next/navigation';

// La redirección principal está en next.config.mjs (307 desde el servidor); esto es respaldo.
export default function HomePage() {
  redirect('/soporte');
}

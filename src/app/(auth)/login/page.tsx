'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export default function LoginPage() { const router = useRouter(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); async function submit(event: React.FormEvent) { event.preventDefault(); const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }); if (response.ok) router.push('/dashboard'); else setError('Credenciales inválidas'); } return <Container maxWidth="sm" className="grid min-h-screen place-items-center"><Card className="w-full"><h1 className="text-2xl font-bold">Entrar a Dcarv</h1><form className="mt-6 grid gap-4" onSubmit={submit}><Input id="email" label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><Input id="password" label="Contraseña" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />{error ? <p className="text-sm text-red-600">{error}</p> : null}<Button type="submit">Entrar</Button></form><p className="mt-5 text-sm text-[var(--text-secondary)]">¿Primera vez? <Link className="text-[var(--accent)]" href="/register">Crear cuenta</Link></p></Card></Container>; }
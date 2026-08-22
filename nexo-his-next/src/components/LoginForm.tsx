'use client';
import { useActionState } from 'react';
import { signIn } from '@/modules/auth/actions';
export function LoginForm(){const[state,action,pending]=useActionState(signIn,{});return <form action={action} className="space-y-4"><label className="field">E-mail<input name="email" type="email" autoComplete="username" required/></label><label className="field">Senha<input name="password" type="password" autoComplete="current-password" minLength={8} required/></label>{state.error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}<button className="primary-button w-full" disabled={pending}>{pending?'Entrando…':'Entrar com segurança'}</button></form>}

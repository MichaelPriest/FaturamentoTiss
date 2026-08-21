import { useState } from 'react';
import Icon from './Icon';

export default function LoginView({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError('');
    try { await onLogin(form.email, form.password); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  return <main className="login-page"><section className="login-card"><div className="brand login-brand"><span className="brand-mark">N</span><div><strong>Nexo HIS</strong><small>Estação hospitalar segura</small></div></div><div className="login-copy"><span className="eyebrow">ACESSO INSTITUCIONAL</span><h1>Entre na sua unidade</h1><p>Utilize as credenciais cadastradas no ambiente hospitalar.</p></div><form onSubmit={submit}><label>E-mail<input type="email" required autoComplete="username" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Senha<input type="password" required minLength="6" autoComplete="current-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>{error&&<p className="form-error">{error}</p>}<button className="primary" disabled={loading}><Icon name="shield" size={15}/>{loading?'Autenticando...':'Acessar unidade'}</button></form><small className="security-note">Acesso protegido por JWT, perfil setorial e políticas RLS.</small></section></main>;
}

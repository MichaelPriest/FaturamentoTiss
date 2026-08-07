import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BuildingOffice2Icon, BuildingStorefrontIcon, UserGroupIcon, PlusIcon, PencilIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { saasAdminService } from '../services/saasAdminService';

const emptyEmpresa = { nome: '', documento: '', ativo: true };
const emptyUnidade = { empresa_id: '', nome: '', codigo: '', cnpj: '', cnes: '', ativo: true };
const emptyUsuario = { nome: '', email: '', password: '', role: 'usuario', empresa_id: '', unidade_ids: [], unidade_padrao_id: '', ativo: true };

export default function SaasAdmin() {
  const [data, setData] = useState({ empresas: [], unidades: [], usuarios: [], acessos: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('empresas');
  const [formType, setFormType] = useState(null);
  const [empresaForm, setEmpresaForm] = useState(emptyEmpresa);
  const [unidadeForm, setUnidadeForm] = useState(emptyUnidade);
  const [usuarioForm, setUsuarioForm] = useState(emptyUsuario);

  const carregar = async () => {
    setLoading(true);
    try { setData(await saasAdminService.carregar()); }
    catch (error) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, []);

  const unidadesDaEmpresa = useMemo(
    () => data.unidades.filter((unidade) => unidade.empresa_id === usuarioForm.empresa_id && unidade.ativo !== false),
    [data.unidades, usuarioForm.empresa_id]
  );
  const empresaNome = (id) => data.empresas.find((empresa) => empresa.id === id)?.nome || 'Empresa não encontrada';
  const acessosUsuario = (id) => data.acessos.filter((acesso) => acesso.usuario_id === id && acesso.ativo !== false);

  const abrirEmpresa = (empresa = null) => { setEmpresaForm(empresa ? { ...empresa } : emptyEmpresa); setFormType('empresa'); };
  const abrirUnidade = (unidade = null) => { setUnidadeForm(unidade ? { ...unidade } : { ...emptyUnidade, empresa_id: data.empresas[0]?.id || '' }); setFormType('unidade'); };
  const abrirUsuario = (usuario = null) => {
    const acessos = usuario ? acessosUsuario(usuario.id) : [];
    setUsuarioForm(usuario ? {
      ...usuario, password: '', unidade_ids: acessos.map((item) => item.unidade_id),
      unidade_padrao_id: acessos.find((item) => item.padrao)?.unidade_id || usuario.unidade_id || ''
    } : { ...emptyUsuario, empresa_id: data.empresas[0]?.id || '' });
    setFormType('usuario');
  };

  const salvar = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      if (formType === 'empresa') await saasAdminService.salvarEmpresa(empresaForm);
      if (formType === 'unidade') await saasAdminService.salvarUnidade(unidadeForm);
      if (formType === 'usuario') {
        if (usuarioForm.id) await saasAdminService.atualizarUsuario(usuarioForm);
        else await saasAdminService.criarUsuario(usuarioForm);
      }
      toast.success('Cadastro salvo com sucesso.'); setFormType(null); await carregar();
    } catch (error) { toast.error(error.message); }
    finally { setSaving(false); }
  };

  const toggleUnidade = (id) => setUsuarioForm((prev) => {
    const selected = prev.unidade_ids.includes(id);
    const unidade_ids = selected ? prev.unidade_ids.filter((value) => value !== id) : [...prev.unidade_ids, id];
    return { ...prev, unidade_ids, unidade_padrao_id: selected && prev.unidade_padrao_id === id ? (unidade_ids[0] || '') : (prev.unidade_padrao_id || id) };
  });

  const tabs = [
    ['empresas', 'Empresas', BuildingOffice2Icon, data.empresas.length],
    ['unidades', 'Unidades', BuildingStorefrontIcon, data.unidades.length],
    ['usuarios', 'Usuários', UserGroupIcon, data.usuarios.length]
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administração SaaS</h1><p className="text-sm text-gray-500">Empresas, unidades e permissões de acesso dos usuários.</p></div>
          <button onClick={carregar} className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border flex items-center gap-2"><ArrowPathIcon className="w-4 h-4" />Atualizar</button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {tabs.map(([id, label, Icon, count]) => <button key={id} onClick={() => setTab(id)} className={`p-4 rounded-xl border text-left flex items-center gap-4 ${tab === id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 dark:text-white'}`}><Icon className="w-8 h-8" /><span><strong className="block text-2xl">{count}</strong><span className="text-sm">{label}</span></span></button>)}
        </div>

        <section className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center"><h2 className="font-semibold dark:text-white">{tabs.find(([id]) => id === tab)?.[1]}</h2><button onClick={() => tab === 'empresas' ? abrirEmpresa() : tab === 'unidades' ? abrirUnidade() : abrirUsuario()} className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm"><PlusIcon className="w-4 h-4" />Novo cadastro</button></div>
          {loading ? <div className="p-12 text-center text-gray-500">Carregando...</div> : (
            <div className="overflow-x-auto">
              {tab === 'empresas' && <table className="w-full text-sm"><thead><tr className="bg-gray-50 dark:bg-gray-700"><th className="p-3 text-left">Empresa</th><th className="p-3 text-left">Documento</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead><tbody>{data.empresas.map((item) => <tr key={item.id} className="border-t dark:border-gray-700"><td className="p-3 font-medium dark:text-white">{item.nome}</td><td className="p-3 text-gray-500">{item.documento || '-'}</td><td className="p-3 text-center">{item.ativo ? 'Ativa' : 'Inativa'}</td><td className="p-3 text-right"><button onClick={() => abrirEmpresa(item)}><PencilIcon className="w-5 h-5 text-blue-600" /></button></td></tr>)}</tbody></table>}
              {tab === 'unidades' && <table className="w-full text-sm"><thead><tr className="bg-gray-50 dark:bg-gray-700"><th className="p-3 text-left">Unidade</th><th className="p-3 text-left">Empresa</th><th className="p-3 text-left">Código/CNES</th><th className="p-3"></th></tr></thead><tbody>{data.unidades.map((item) => <tr key={item.id} className="border-t dark:border-gray-700"><td className="p-3 font-medium dark:text-white">{item.nome}</td><td className="p-3 text-gray-500">{empresaNome(item.empresa_id)}</td><td className="p-3 text-gray-500">{item.codigo || '-'} / {item.cnes || '-'}</td><td className="p-3 text-right"><button onClick={() => abrirUnidade(item)}><PencilIcon className="w-5 h-5 text-blue-600" /></button></td></tr>)}</tbody></table>}
              {tab === 'usuarios' && <table className="w-full text-sm"><thead><tr className="bg-gray-50 dark:bg-gray-700"><th className="p-3 text-left">Usuário</th><th className="p-3 text-left">Empresa</th><th className="p-3 text-left">Unidades permitidas</th><th className="p-3"></th></tr></thead><tbody>{data.usuarios.map((item) => <tr key={item.id} className="border-t dark:border-gray-700"><td className="p-3 dark:text-white"><strong className="block">{item.nome}</strong><span className="text-gray-500">{item.email} · {item.role}</span></td><td className="p-3 text-gray-500">{empresaNome(item.empresa_id)}</td><td className="p-3 text-gray-500">{acessosUsuario(item.id).map((a) => data.unidades.find((u) => u.id === a.unidade_id)?.nome).filter(Boolean).join(', ') || 'Sem acesso'}</td><td className="p-3 text-right"><button onClick={() => abrirUsuario(item)}><PencilIcon className="w-5 h-5 text-blue-600" /></button></td></tr>)}</tbody></table>}
            </div>
          )}
        </section>
      </div>

      {formType && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><form onSubmit={salvar} className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4"><h2 className="text-xl font-bold dark:text-white">{formType === 'empresa' ? 'Empresa' : formType === 'unidade' ? 'Unidade' : 'Usuário e acessos'}</h2>
        {formType === 'empresa' && <><input required placeholder="Nome da empresa" value={empresaForm.nome} onChange={(e) => setEmpresaForm({...empresaForm, nome: e.target.value})} className="input-saas"/><input placeholder="CNPJ/Documento" value={empresaForm.documento || ''} onChange={(e) => setEmpresaForm({...empresaForm, documento: e.target.value})} className="input-saas"/></>}
        {formType === 'unidade' && <><select required value={unidadeForm.empresa_id} onChange={(e) => setUnidadeForm({...unidadeForm, empresa_id: e.target.value})} className="input-saas"><option value="">Selecione a empresa</option>{data.empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select><input required placeholder="Nome da unidade" value={unidadeForm.nome} onChange={(e) => setUnidadeForm({...unidadeForm, nome: e.target.value})} className="input-saas"/><div className="grid sm:grid-cols-3 gap-3"><input placeholder="Código" value={unidadeForm.codigo || ''} onChange={(e) => setUnidadeForm({...unidadeForm, codigo: e.target.value})} className="input-saas"/><input placeholder="CNPJ" value={unidadeForm.cnpj || ''} onChange={(e) => setUnidadeForm({...unidadeForm, cnpj: e.target.value})} className="input-saas"/><input placeholder="CNES" value={unidadeForm.cnes || ''} onChange={(e) => setUnidadeForm({...unidadeForm, cnes: e.target.value})} className="input-saas"/></div></>}
        {formType === 'usuario' && <><div className="grid sm:grid-cols-2 gap-3"><input required placeholder="Nome" value={usuarioForm.nome} onChange={(e) => setUsuarioForm({...usuarioForm, nome: e.target.value})} className="input-saas"/><input required disabled={Boolean(usuarioForm.id)} type="email" placeholder="E-mail" value={usuarioForm.email} onChange={(e) => setUsuarioForm({...usuarioForm, email: e.target.value})} className="input-saas"/></div><div className="grid sm:grid-cols-2 gap-3"><input required={!usuarioForm.id} type="password" placeholder={usuarioForm.id ? 'Nova senha (opcional)' : 'Senha (mínimo 8 caracteres)'} value={usuarioForm.password} onChange={(e) => setUsuarioForm({...usuarioForm, password: e.target.value})} className="input-saas"/><select value={usuarioForm.role} onChange={(e) => setUsuarioForm({...usuarioForm, role: e.target.value})} className="input-saas"><option value="usuario">Usuário</option><option value="admin">Administrador da unidade</option></select></div><select required value={usuarioForm.empresa_id} onChange={(e) => setUsuarioForm({...usuarioForm, empresa_id: e.target.value, unidade_ids: [], unidade_padrao_id: ''})} className="input-saas"><option value="">Selecione a empresa</option>{data.empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select><div><p className="text-sm font-medium mb-2 dark:text-white">Unidades permitidas</p><div className="grid sm:grid-cols-2 gap-2">{unidadesDaEmpresa.map((u) => <label key={u.id} className="border dark:border-gray-600 rounded-lg p-3 flex items-center gap-2 dark:text-white"><input type="checkbox" checked={usuarioForm.unidade_ids.includes(u.id)} onChange={() => toggleUnidade(u.id)}/><span className="flex-1">{u.nome}</span>{usuarioForm.unidade_ids.includes(u.id) && <input type="radio" name="padrao" title="Unidade padrão" checked={usuarioForm.unidade_padrao_id === u.id} onChange={() => setUsuarioForm({...usuarioForm, unidade_padrao_id: u.id})}/>}</label>)}</div></div></>}
        <label className="flex items-center gap-2 dark:text-white"><input type="checkbox" checked={(formType === 'empresa' ? empresaForm : formType === 'unidade' ? unidadeForm : usuarioForm).ativo !== false} onChange={(e) => formType === 'empresa' ? setEmpresaForm({...empresaForm, ativo: e.target.checked}) : formType === 'unidade' ? setUnidadeForm({...unidadeForm, ativo: e.target.checked}) : setUsuarioForm({...usuarioForm, ativo: e.target.checked})}/>Cadastro ativo</label>
        <div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => setFormType(null)} className="px-4 py-2 border rounded-lg dark:text-white">Cancelar</button><button disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button></div>
      </form></div>}
    </div>
  );
}

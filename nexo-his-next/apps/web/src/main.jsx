import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Icon from './components/Icon';
import LoginView from './components/LoginView';
import ReceptionModule from './components/ReceptionModule';
import TriageModule from './components/TriageModule';
import { getStoredSession, isHisApiConfigured, loadOperationalDashboard, searchPatients, signIn, signOut } from './lib/hisApi';
import './styles.css';

const menu = [
  { group: 'Jornada do paciente', items: [['home','Visão operacional'],['calendar','Recepção e agenda'],['emergency','Pronto atendimento'],['bed','Internação e leitos'],['clinical','Estação clínica'],['discharge','Alta e continuidade']] },
  { group: 'Receita assistencial', items: [['shield','Autorizações'],['account','Conta hospitalar'],['send','Remessas TISS'],['alert','Glosas e recursos']] },
  { group: 'Gestão', items: [['stock','Farmácia e estoque'],['surgery','Centro cirúrgico'],['diagnostic','Apoio diagnóstico'],['finance','Financeiro e BI']] }
];

const patients = [
  { initials:'AS', name:'Ana Souza', id:'00018452', age:'42 anos', payer:'Saúde Integral', journey:'Internada', risk:'Atenção', bed:'3A · 312', since:'2d 6h' },
  { initials:'CM', name:'Carlos Mendes', id:'00018461', age:'67 anos', payer:'Vida Plena', journey:'Em atendimento', risk:'Urgente', bed:'PA · Box 04', since:'38 min' },
  { initials:'JL', name:'Joana Lima', id:'00018437', age:'29 anos', payer:'Particular', journey:'Aguardando alta', risk:'Estável', bed:'2B · 208', since:'1d 3h' }
];

const cards = [
  { label:'Pacientes na unidade', value:'128', note:'+7 nas últimas 2h', tone:'blue' },
  { label:'Leitos ocupados', value:'82%', note:'14 leitos disponíveis', tone:'green' },
  { label:'Contas a fechar', value:'36', note:'R$ 284.920,40', tone:'amber' },
  { label:'Glosas no prazo', value:'18', note:'5 vencem nesta semana', tone:'red' }
];

const moduleDefinitions = {
  'Recepção e agenda': ['Abrir atendimento', 'Confirmar chegada', 'Validar elegibilidade', 'Encaminhar para triagem'],
  'Pronto atendimento': ['Classificar risco', 'Chamar próximo paciente', 'Registrar atendimento', 'Solicitar internação'],
  'Internação e leitos': ['Mapa de leitos', 'Registrar internação', 'Transferir paciente', 'Preparar alta'],
  'Estação clínica': ['Evolução multiprofissional', 'Prescrição eletrônica', 'Solicitar exames', 'Checagem segura'],
  'Alta e continuidade': ['Conferir pendências', 'Sumário de alta', 'Reconciliação medicamentosa', 'Fechar internação'],
  'Autorizações': ['Nova solicitação', 'Consultar operadora', 'Anexar documentos', 'Tratar pendências'],
  'Conta hospitalar': ['Contas abertas', 'Auditar lançamentos', 'Consolidar consumo', 'Fechar conta'],
  'Remessas TISS': ['Gerar lote', 'Validar XML/XSD', 'Assinar remessa', 'Processar retorno'],
  'Glosas e recursos': ['Analisar glosas', 'Abrir recurso', 'Anexar prontuário', 'Acompanhar decisão'],
  'Farmácia e estoque': ['Dispensar prescrição', 'Receber materiais', 'Inventário', 'Rastrear lote'],
  'Centro cirúrgico': ['Agenda cirúrgica', 'Checklist seguro', 'Consignados', 'Registrar sala'],
  'Apoio diagnóstico': ['Fila de exames', 'Coletar material', 'Liberar laudo', 'Comunicar resultado crítico'],
  'Financeiro e BI': ['Contas a receber', 'Conciliação', 'Indicadores de glosa', 'Resultado por operadora']
};

function App() {
  const [session,setSession]=useState(getStoredSession());
  const [active, setActive] = useState('Visão operacional');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(patients[0]);
  const [remotePatients, setRemotePatients] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [dataState, setDataState] = useState(isHisApiConfigured ? 'loading' : 'demo');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isHisApiConfigured || !session) return;
    loadOperationalDashboard().then(data => { setDashboard(data); setDataState('live'); }).catch(err => { setError(err.message); setDataState('error'); });
  }, [session]);
  useEffect(() => {
    if (!isHisApiConfigured || query.trim().length < 2) { setRemotePatients([]); return; }
    const timer = setTimeout(() => searchPatients(query).then(setRemotePatients).catch(err => setError(err.message)), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const filtered = useMemo(() => isHisApiConfigured ? remotePatients.map(p => ({ initials:p.nome.split(' ').slice(0,2).map(x=>x[0]).join(''), name:p.nome, id:String(p.id).padStart(8,'0'), age:'Cadastro ativo', payer:'Consulte o atendimento', journey:'Paciente', risk:'Sem classificação', bed:'—', since:'—' })) : patients.filter(p => `${p.name} ${p.id} ${p.payer}`.toLowerCase().includes(query.toLowerCase())), [query, remotePatients]);
  const liveCards = dashboard ? [
    { label:'Pacientes cadastrados', value:String(dashboard.metrics.patients), note:'Registros visíveis na unidade', tone:'blue' },
    { label:'Internações ativas', value:String(dashboard.metrics.admissions), note:'Atualizado em tempo real', tone:'green' },
    { label:'Contas a fechar', value:String(dashboard.metrics.openAccounts), note:'Abertas ou fechadas', tone:'amber' },
    { label:'Glosas no prazo', value:String(dashboard.metrics.pendingGlosas), note:'Pendentes de análise', tone:'red' }
  ] : cards;
  const displayPatients = dashboard ? dashboard.patients.map(patient => ({
    initials: patient.nome.split(' ').slice(0,2).map(part=>part[0]).join(''), name: patient.nome,
    id: String(patient.id).padStart(8,'0'), age: patient.data_nascimento ? new Date(`${patient.data_nascimento}T12:00:00`).toLocaleDateString('pt-BR') : 'Nascimento não informado', payer: 'Atendimento atual', journey: patient.admission ? 'Internada' : 'Cadastro ativo',
    bed: patient.admission ? 'Internação ativa' : '—', since: patient.admission ? new Date(patient.admission.data_entrada).toLocaleDateString('pt-BR') : '—', risk: 'Sem alerta'
  })) : patients;
  const journeyStages=dashboard?[['Recepção',String((dashboard.receptionSummary.AGENDADO||0)+(dashboard.receptionSummary.CHEGOU||0)),'aguardando triagem'],['Triagem',String(dashboard.receptionSummary.TRIAGEM||0),'classificados'],['Atendimento',String(dashboard.receptionSummary.EM_ATENDIMENTO||0),'em atendimento'],['Internação',String(dashboard.metrics.admissions),'internações ativas'],['Alta','—','em atualização']]:[['Recepção','24','6 aguardando cadastro'],['Triagem','11','3 acima do tempo'],['Atendimento','38','12 em consultório'],['Internação','47','82% de ocupação'],['Alta','8','5 com pendências']];
  if (isHisApiConfigured && !session) return <LoginView onLogin={async(email,password)=>setSession(await signIn(email,password))}/>;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">N</span><div><strong>Nexo HIS</strong><small>Gestão hospitalar integrada</small></div></div>
      <nav>{menu.map(section => <section key={section.group}><h3>{section.group}</h3>{section.items.map(([icon,label]) => <button key={label} className={active===label?'active':''} onClick={()=>setActive(label)}><Icon name={icon} size={16}/>{label}{label==='Glosas e recursos'&&<b>{dashboard?.metrics.pendingGlosas ?? 5}</b>}</button>)}</section>)}</nav>
      <div className="unit-card"><span className="status-dot"/><div><strong>Hospital Central</strong><small>Unidade Matriz · CNES 1234567</small></div></div>
    </aside>
    <main>
      <header className="topbar"><div><span className="eyebrow">CENTRAL OPERACIONAL</span><h1>{active}</h1></div><div className="top-actions"><span className={`data-status ${dataState}`}>{dataState==='live'?'Dados reais':dataState==='loading'?'Sincronizando':dataState==='error'?'Falha na conexão':'Demonstração'}</span><button className="icon-btn" aria-label="Notificações"><Icon name="bell" size={16}/><i/></button><div className="avatar">{session?.user?.email?.slice(0,2).toUpperCase()||'MF'}</div><div className="user"><strong>{session?.user?.email||'Marina Ferreira'}</strong><button className="logout-link" onClick={()=>{signOut();setSession(null)}}>{session?'Sair':'Supervisão · Faturamento'}</button></div></div></header>
      <section className="patient-bar"><div className="search-wrap"><span><Icon name="search" size={16}/></span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Localizar paciente por nome, prontuário ou CPF"/>{query&&<div className="search-results">{filtered.map(p=><button key={p.id} onClick={()=>{setSelected(p);setQuery('')}}><span className="mini-avatar">{p.initials}</span><span><strong>{p.name}</strong><small>Pront. {p.id} · {p.payer}</small></span></button>)}{filtered.length===0&&<p>Nenhum paciente localizado.</p>}</div>}</div><div className="patient-context"><span className="patient-avatar">{selected.initials}</span><div><strong>{selected.name}</strong><small>Pront. {selected.id} · {selected.age} · {selected.payer}</small></div><span className="tag blue">{selected.journey}</span><button>Ver contexto completo <Icon name="chevron" size={12}/></button></div></section>
      <div className="workspace">
        <section className="hero"><div><span className="eyebrow">SEXTA-FEIRA, 21 DE AGOSTO</span><h2>Bom dia, Marina.</h2><p>Acompanhe a operação assistencial e financeira da unidade em uma única visão.</p>{error&&<p className="connection-error">{error}</p>}</div><div className="hero-actions"><button className="secondary"><Icon name="download" size={14}/> Exportar painel</button><button className="primary"><Icon name="plus" size={14}/> Nova admissão</button></div></section>
        {active === 'Recepção e agenda' ? <ReceptionModule onPatientSelected={patient=>setSelected({initials:patient.nome.split(' ').slice(0,2).map(x=>x[0]).join(''),name:patient.nome,id:String(patient.id).padStart(8,'0'),age:'Cadastro ativo',payer:'Consulte o atendimento',journey:'Recepção'})}/> : active === 'Pronto atendimento' ? <TriageModule onPatientSelected={patient=>setSelected({initials:patient.nome.split(' ').slice(0,2).map(x=>x[0]).join(''),name:patient.nome,id:String(patient.id).padStart(8,'0'),age:'Cadastro ativo',payer:'Atendimento atual',journey:'Triagem'})}/> : active === 'Visão operacional' ? <><section className="metrics">{liveCards.map(c=><article className={`metric ${c.tone}`} key={c.label}><div><span>{c.label}</span><strong>{c.value}</strong><small>{c.note}</small></div><i/></article>)}</section>
        <section className="grid-main">
          <article className="panel flow-panel"><header><div><h3>Fluxo assistencial em tempo real</h3><p>Pacientes por etapa da jornada</p></div><button>Ver central →</button></header><div className="journey">
            {journeyStages.map((x,i)=><React.Fragment key={x[0]}><div className="stage"><span>{i+1}</span><strong>{x[1]}</strong><b>{x[0]}</b><small>{x[2]}</small></div>{i<4&&<em>›</em>}</React.Fragment>)}
          </div></article>
          <article className="panel pending"><header><div><h3>Pendências prioritárias</h3><p>Exigem ação da sua equipe</p></div><span className="tag red">12 abertas</span></header>{[
            ['Glosas vencem em até 5 dias','5 contas · R$ 18.420,00','Recorrer','red'],['Contas aguardando fechamento','12 contas · R$ 96.340,50','Revisar','amber'],['Altas com documentação incompleta','3 pacientes · prontuário pendente','Regularizar','blue']
          ].map(x=><div className="pending-row" key={x[0]}><span className={`alert-icon ${x[3]}`}>!</span><div><strong>{x[0]}</strong><small>{x[1]}</small></div><button>{x[2]}</button></div>)}</article>
          <article className="panel table-panel"><header><div><h3>Pacientes em acompanhamento</h3><p>Visão integrada da unidade</p></div><button>Todos os pacientes →</button></header><table><thead><tr><th>Paciente</th><th>Jornada</th><th>Local</th><th>Tempo</th><th>Condição</th><th></th></tr></thead><tbody>{displayPatients.map(p=><tr key={p.id} onClick={()=>setSelected(p)}><td><span className="mini-avatar">{p.initials}</span><span><strong>{p.name}</strong><small>Pront. {p.id}</small></span></td><td><span className="tag blue">{p.journey}</span></td><td>{p.bed}</td><td>{p.since}</td><td><span className={`condition ${p.risk==='Urgente'?'urgent':''}`}>{p.risk}</span></td><td>•••</td></tr>)}</tbody></table></article>
        </section></> : <section className="module-workspace"><header><div><span className="eyebrow">MÓDULO OPERACIONAL</span><h3>{active}</h3><p>Fila de trabalho integrada ao contexto do paciente e às permissões do setor.</p></div><button className="primary"><Icon name="plus" size={14}/> Novo registro</button></header><div className="module-actions">{(moduleDefinitions[active] || []).map((label,index)=><button key={label}><span>{String(index+1).padStart(2,'0')}</span><div><strong>{label}</strong><small>Abrir função e manter o paciente selecionado</small></div><Icon name="chevron" size={16}/></button>)}</div><div className="empty-queue"><Icon name="account" size={24}/><div><strong>Fila pronta para integração</strong><p>Os registros aparecerão aqui após a aplicação das migrations e a autenticação da unidade.</p></div></div></section>}
      </div>
    </main>
  </div>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);

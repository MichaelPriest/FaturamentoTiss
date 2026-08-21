import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const menu = [
  { group: 'Jornada do paciente', items: [['⌂','Visão operacional'],['◎','Recepção e agenda'],['⚕','Pronto atendimento'],['▣','Internação e leitos'],['✚','Estação clínica'],['✓','Alta e continuidade']] },
  { group: 'Receita assistencial', items: [['↗','Autorizações'],['▤','Conta hospitalar'],['⇄','Remessas TISS'],['!','Glosas e recursos']] },
  { group: 'Gestão', items: [['◫','Farmácia e estoque'],['◈','Centro cirúrgico'],['⌁','Apoio diagnóstico'],['◒','Financeiro e BI']] }
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

function App() {
  const [active, setActive] = useState('Visão operacional');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(patients[0]);
  const filtered = useMemo(() => patients.filter(p => `${p.name} ${p.id} ${p.payer}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">N</span><div><strong>Nexo HIS</strong><small>Gestão hospitalar integrada</small></div></div>
      <nav>{menu.map(section => <section key={section.group}><h3>{section.group}</h3>{section.items.map(([icon,label]) => <button key={label} className={active===label?'active':''} onClick={()=>setActive(label)}><span>{icon}</span>{label}{label==='Glosas e recursos'&&<b>5</b>}</button>)}</section>)}</nav>
      <div className="unit-card"><span className="status-dot"/><div><strong>Hospital Central</strong><small>Unidade Matriz · CNES 1234567</small></div></div>
    </aside>
    <main>
      <header className="topbar"><div><span className="eyebrow">CENTRAL OPERACIONAL</span><h1>{active}</h1></div><div className="top-actions"><button className="icon-btn" aria-label="Notificações">♢<i/></button><div className="avatar">MF</div><div className="user"><strong>Marina Ferreira</strong><small>Supervisão · Faturamento</small></div></div></header>
      <section className="patient-bar"><div className="search-wrap"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Localizar paciente por nome, prontuário ou CPF"/>{query&&<div className="search-results">{filtered.map(p=><button key={p.id} onClick={()=>{setSelected(p);setQuery('')}}><span className="mini-avatar">{p.initials}</span><span><strong>{p.name}</strong><small>Pront. {p.id} · {p.payer}</small></span></button>)}</div>}</div><div className="patient-context"><span className="patient-avatar">{selected.initials}</span><div><strong>{selected.name}</strong><small>Pront. {selected.id} · {selected.age} · {selected.payer}</small></div><span className="tag blue">{selected.journey}</span><button>Ver contexto completo →</button></div></section>
      <div className="workspace">
        <section className="hero"><div><span className="eyebrow">SEXTA-FEIRA, 21 DE AGOSTO</span><h2>Bom dia, Marina.</h2><p>Acompanhe a operação assistencial e financeira da unidade em uma única visão.</p></div><div className="hero-actions"><button className="secondary">Exportar painel</button><button className="primary">+ Nova admissão</button></div></section>
        <section className="metrics">{cards.map(c=><article className={`metric ${c.tone}`} key={c.label}><div><span>{c.label}</span><strong>{c.value}</strong><small>{c.note}</small></div><i/></article>)}</section>
        <section className="grid-main">
          <article className="panel flow-panel"><header><div><h3>Fluxo assistencial em tempo real</h3><p>Pacientes por etapa da jornada</p></div><button>Ver central →</button></header><div className="journey">
            {[['Recepção','24','6 aguardando cadastro'],['Triagem','11','3 acima do tempo'],['Atendimento','38','12 em consultório'],['Internação','47','82% de ocupação'],['Alta','8','5 com pendências']].map((x,i)=><React.Fragment key={x[0]}><div className="stage"><span>{i+1}</span><strong>{x[1]}</strong><b>{x[0]}</b><small>{x[2]}</small></div>{i<4&&<em>›</em>}</React.Fragment>)}
          </div></article>
          <article className="panel pending"><header><div><h3>Pendências prioritárias</h3><p>Exigem ação da sua equipe</p></div><span className="tag red">12 abertas</span></header>{[
            ['Glosas vencem em até 5 dias','5 contas · R$ 18.420,00','Recorrer','red'],['Contas aguardando fechamento','12 contas · R$ 96.340,50','Revisar','amber'],['Altas com documentação incompleta','3 pacientes · prontuário pendente','Regularizar','blue']
          ].map(x=><div className="pending-row" key={x[0]}><span className={`alert-icon ${x[3]}`}>!</span><div><strong>{x[0]}</strong><small>{x[1]}</small></div><button>{x[2]}</button></div>)}</article>
          <article className="panel table-panel"><header><div><h3>Pacientes em acompanhamento</h3><p>Visão integrada da unidade</p></div><button>Todos os pacientes →</button></header><table><thead><tr><th>Paciente</th><th>Jornada</th><th>Local</th><th>Tempo</th><th>Condição</th><th></th></tr></thead><tbody>{patients.map(p=><tr key={p.id} onClick={()=>setSelected(p)}><td><span className="mini-avatar">{p.initials}</span><span><strong>{p.name}</strong><small>Pront. {p.id}</small></span></td><td><span className="tag blue">{p.journey}</span></td><td>{p.bed}</td><td>{p.since}</td><td><span className={`condition ${p.risk==='Urgente'?'urgent':''}`}>{p.risk}</span></td><td>•••</td></tr>)}</tbody></table></article>
        </section>
      </div>
    </main>
  </div>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);

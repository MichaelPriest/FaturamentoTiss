import { useEffect,useState } from 'react';
import Icon from './Icon';
import { loadPharmacyQueue,updatePharmacyRequest } from '../lib/hisApi';

export default function PharmacyModule(){
  const[queue,setQueue]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  async function reload(){setLoading(true);try{setQueue(await loadPharmacyQueue());setError('');}catch(e){setError(e.message);}finally{setLoading(false);}}
  useEffect(()=>{reload();},[]);
  async function advance(item,status){try{await updatePharmacyRequest(item.id,status);await reload();}catch(e){setError(e.message);}}
  return <section className="module-workspace pharmacy-module"><header><div><span className="eyebrow">FARMÁCIA CLÍNICA</span><h3>Prescrições para dispensação</h3><p>Fila integrada em tempo real com as prescrições emitidas na Estação clínica.</p></div><span className="tag blue">{queue.length} pendentes</span></header>{error&&<p className="module-error">{error}</p>}<div className="pharmacy-list">{loading?<p>Carregando...</p>:queue.length?queue.map(item=><article key={item.id}><div className={`pharmacy-priority ${item.prioridade.toLowerCase()}`}>{item.prioridade}</div><div><strong>{item.pacientes?.nome}</strong><small>Solicitada em {new Date(item.solicitado_em).toLocaleString('pt-BR')}</small><p>{item.conteudo}</p></div><span className="tag blue">{item.status.replace('_',' ')}</span><div className="pharmacy-actions">{item.status==='PENDENTE'&&<button className="secondary" onClick={()=>advance(item,'EM_SEPARACAO')}>Iniciar separação</button>}{item.status==='EM_SEPARACAO'&&<button className="primary" onClick={()=>advance(item,'DISPENSADA')}>Confirmar dispensação</button>}</div></article>):<div className="compact-empty"><Icon name="stock" size={26}/> Nenhuma prescrição aguardando dispensação.</div>}</div></section>;
}

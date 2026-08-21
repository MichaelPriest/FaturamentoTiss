import { useEffect,useState } from 'react';
import Icon from './Icon';
import { loadClinicalQueue,loadClinicalRecord,registerClinicalEvolution } from '../lib/hisApi';
import { validateClinicalEvolution } from '../lib/clinicalRules';

const empty={atendimento_id:'',subjetivo:'',objetivo:'',avaliacao:'',plano:'',cid10:'',prescricao:'',exames_solicitados:'',orientacoes:'',desfecho:'PERMANECE',finalizar:false,prioridade_farmacia:'ROTINA',emitir_atestado:false,dias_atestado:'',texto_atestado:'',reavaliar_em:''};
export default function ClinicalModule({onPatientSelected}){
  const[queue,setQueue]=useState([]),[history,setHistory]=useState([]),[form,setForm]=useState(empty),[error,setError]=useState(''),[success,setSuccess]=useState(''),[loading,setLoading]=useState(true),[loadingHistory,setLoadingHistory]=useState(false),[saving,setSaving]=useState(false);
  async function reload(){setLoading(true);try{setQueue(await loadClinicalQueue());setError('');}catch(e){setError(e.message);}finally{setLoading(false);}}
  useEffect(()=>{reload();},[]);
  async function select(item){
    setForm({...empty,atendimento_id:item.id});setSuccess('');setError('');onPatientSelected?.(item.pacientes);setLoadingHistory(true);
    try{setHistory(await loadClinicalRecord(item.id));}catch(e){setError(e.message);setHistory([]);}finally{setLoadingHistory(false);}
  }
  async function submit(event){event.preventDefault();const errors=validateClinicalEvolution(form);if(errors.length){setError(errors.join(' '));return;}setSaving(true);try{await registerClinicalEvolution(form);setSuccess(form.finalizar?'Atendimento finalizado com segurança.':'Evolução, prescrição e solicitações registradas.');const id=form.atendimento_id;setForm(form.finalizar?empty:{...empty,atendimento_id:id});setHistory(form.finalizar?[]:await loadClinicalRecord(id));setError('');await reload();}catch(e){setError(e.message);}finally{setSaving(false);}}
  const selected=queue.find(item=>item.id===form.atendimento_id),triage=selected?.triagens?.[0];
  return <section className="module-workspace clinical-module">
    <header><div><span className="eyebrow">ESTAÇÃO CLÍNICA</span><h3>Atendimento clínico</h3><p>Evolução SOAP, prescrição, solicitações, orientações e desfecho em um único prontuário.</p></div><span className="tag blue">{queue.length} em atendimento</span></header>
    {error&&<p className="module-error">{error}</p>}{success&&<p className="module-success">{success}</p>}
    <div className="clinical-layout"><aside className="clinical-queue"><h4>Fila clínica</h4>{loading?<p>Carregando...</p>:queue.length?queue.map(item=>{const itemTriage=item.triagens?.[0];return <button key={item.id} className={form.atendimento_id===item.id?'selected':''} onClick={()=>select(item)}><span className="mini-avatar">{item.pacientes.nome.split(' ').slice(0,2).map(x=>x[0]).join('')}</span><div><strong>{item.pacientes.nome}</strong><small>{itemTriage?.queixa_principal||'Sem queixa registrada'}</small></div>{itemTriage&&<span className={`risk-dot ${itemTriage.classificacao.toLowerCase()}`}>{itemTriage.classificacao}</span>}<Icon name="chevron" size={14}/></button>}):<div className="compact-empty">Nenhum paciente em atendimento.</div>}</aside>
      <form className="clinical-form" onSubmit={submit}>
        <TriageSummary patient={selected?.pacientes} triage={triage} />
        {history.length>0&&<details className="clinical-history"><summary>Histórico deste atendimento ({history.length})</summary>{history.map(item=><article key={item.id}><strong>{new Date(item.created_at).toLocaleString('pt-BR')} · {item.cid10||'Sem CID'}</strong><p><b>S:</b> {item.subjetivo} <b>A:</b> {item.avaliacao}</p>{item.prescricao&&<p><b>Prescrição:</b> {item.prescricao}</p>}</article>)}</details>}{loadingHistory&&<p className="clinical-loading">Carregando histórico...</p>}
        {[['subjetivo','S · Subjetivo','Relato, sintomas e história do paciente'],['objetivo','O · Objetivo','Exame físico, sinais e achados'],['avaliacao','A · Avaliação','Hipóteses e impressão diagnóstica'],['plano','P · Plano','Condutas e plano terapêutico']].map(([field,label,placeholder])=><label key={field}>{label}<textarea disabled={!form.atendimento_id} required placeholder={placeholder} value={form[field]} onChange={e=>setForm({...form,[field]:e.target.value})}/></label>)}
        <label>Prescrição clínica<textarea disabled={!form.atendimento_id} placeholder="Medicamento, dose, via, frequência e duração" value={form.prescricao} onChange={e=>setForm({...form,prescricao:e.target.value})}/><small className="field-help">Ao salvar, a prescrição é enviada automaticamente para a fila da Farmácia.</small></label>
        <label>Prioridade da Farmácia<select disabled={!form.atendimento_id||!form.prescricao.trim()} value={form.prioridade_farmacia} onChange={e=>setForm({...form,prioridade_farmacia:e.target.value})}><option value="ROTINA">Rotina</option><option value="URGENTE">Urgente</option><option value="IMEDIATA">Imediata</option></select><small className="field-help">A Farmácia acompanha separação e dispensação.</small></label>
        <label>Exames e procedimentos<textarea disabled={!form.atendimento_id} placeholder="Solicitações e prioridade clínica" value={form.exames_solicitados} onChange={e=>setForm({...form,exames_solicitados:e.target.value})}/></label>
        <label className="clinical-wide">Orientações ao paciente<textarea disabled={!form.atendimento_id} placeholder="Cuidados, sinais de alerta, retorno e encaminhamentos" value={form.orientacoes} onChange={e=>setForm({...form,orientacoes:e.target.value})}/></label>
        <section className="medical-document"><label className="finish-check"><input type="checkbox" disabled={!form.atendimento_id} checked={form.emitir_atestado} onChange={e=>setForm({...form,emitir_atestado:e.target.checked})}/> Emitir atestado médico assinado</label>{form.emitir_atestado&&<><label>Dias de afastamento<input type="number" min="1" max="365" value={form.dias_atestado} onChange={e=>setForm({...form,dias_atestado:e.target.value})}/></label><label className="document-text">Conteúdo do atestado<textarea value={form.texto_atestado} onChange={e=>setForm({...form,texto_atestado:e.target.value})} placeholder="Declaro, para os devidos fins..."/></label><p>Assinatura eletrônica vinculada ao médico autenticado, data/hora e hash de integridade.</p></>}</section>
        <div className="clinical-outcome"><label>CID-10<input disabled={!form.atendimento_id} placeholder="Ex.: R10.4" value={form.cid10} onChange={e=>setForm({...form,cid10:e.target.value.toUpperCase()})}/></label><label>Desfecho<select disabled={!form.atendimento_id} value={form.desfecho} onChange={e=>setForm({...form,desfecho:e.target.value})}><option value="PERMANECE">Permanece em atendimento</option><option value="REAVALIACAO">Programar reavaliação</option><option value="OBSERVACAO">Encaminhar para observação</option><option value="ALTA">Alta</option><option value="INTERNACAO">Internar paciente</option><option value="TRANSFERENCIA">Transferência</option></select></label>{form.desfecho==='REAVALIACAO'&&<label>Reavaliar em<input type="datetime-local" value={form.reavaliar_em} onChange={e=>setForm({...form,reavaliar_em:e.target.value})}/></label>}<label className="finish-check"><input type="checkbox" disabled={!form.atendimento_id||['OBSERVACAO','REAVALIACAO'].includes(form.desfecho)} checked={form.finalizar} onChange={e=>setForm({...form,finalizar:e.target.checked})}/> Finalizar atendimento após salvar</label></div>
        <div className="form-actions"><button type="button" className="secondary" onClick={()=>{setForm(empty);setHistory([]);}}>Limpar</button><button className="primary" disabled={saving||!form.atendimento_id}>{saving?'Salvando...':form.finalizar?'Salvar e finalizar':'Registrar atendimento'}</button></div>
      </form></div>
  </section>;
}

function TriageSummary({patient,triage}) {
  if(!patient) return <div className="clinical-summary clinical-summary-empty"><Icon name="clinical" size={22}/><div><strong>Selecione um paciente da fila</strong><small>A classificação de risco e os sinais vitais ficarão disponíveis antes do registro clínico.</small></div></div>;
  const risk=(triage?.classificacao||'SEM CLASSIFICAÇÃO').toLowerCase();
  const vitals=[
    ['Pressão arterial',triage?.pressao_sistolica&&triage?.pressao_diastolica?`${triage.pressao_sistolica}/${triage.pressao_diastolica}`:'—','mmHg'],
    ['Frequência cardíaca',triage?.frequencia_cardiaca||'—','bpm'],
    ['Saturação',triage?.saturacao??'—','%'],
    ['Temperatura',triage?.temperatura??'—','°C'],
    ['Escala de dor',triage?.escala_dor??'—','/ 10']
  ];
  return <section className="triage-clinical-card">
    <header><div><span className="eyebrow">RESUMO DA TRIAGEM</span><h4>{patient.nome}</h4><small>Chegada assistencial · dados disponíveis para decisão clínica</small></div><span className={`triage-risk ${risk}`}>{triage?.classificacao||'Não classificado'}</span></header>
    <div className="triage-complaint"><span>Queixa principal</span><strong>{triage?.queixa_principal||'Não informada'}</strong>{triage?.observacoes&&<p><b>Observações da triagem:</b> {triage.observacoes}</p>}</div>
    <div className="triage-vitals">{vitals.map(([label,value,unit])=><article key={label}><span>{label}</span><strong>{value}</strong><small>{unit}</small></article>)}</div>
    {triage?.realizada_em&&<footer>Classificação realizada em {new Date(triage.realizada_em).toLocaleString('pt-BR')}</footer>}
  </section>;
}

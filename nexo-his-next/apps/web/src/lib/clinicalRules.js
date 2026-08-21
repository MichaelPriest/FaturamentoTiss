export function validateClinicalEvolution(form) {
  const errors=[];
  for(const [field,label] of [['subjetivo','Subjetivo'],['objetivo','Objetivo'],['avaliacao','Avaliação'],['plano','Plano']]) {
    if((form[field]||'').trim().length<3) errors.push(`${label} deve ter ao menos 3 caracteres.`);
  }
  if(form.finalizar&&form.desfecho==='PERMANECE') errors.push('Selecione um desfecho para finalizar.');
  if(form.cid10&&!/^[A-Z][0-9]{2}(\.[0-9A-Z]{1,2})?$/i.test(form.cid10.trim())) errors.push('CID-10 inválido.');
  if(form.finalizar&&!(form.orientacoes||'').trim()) errors.push('Registre as orientações de alta ou encaminhamento.');
  return errors;
}

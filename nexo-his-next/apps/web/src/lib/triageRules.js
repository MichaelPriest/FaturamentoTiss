export const RISK_LEVELS = ['AZUL','VERDE','AMARELO','LARANJA','VERMELHO'];

export function validateTriage(form) {
  const errors=[];
  if(!form.atendimento_id) errors.push('Selecione o paciente.');
  if(!RISK_LEVELS.includes(form.classificacao)) errors.push('Classificação inválida.');
  if(String(form.queixa_principal||'').trim().length<3) errors.push('Informe a queixa principal.');
  const ranges={pressao_sistolica:[40,300],pressao_diastolica:[20,200],frequencia_cardiaca:[20,250],saturacao:[40,100],temperatura:[30,45],escala_dor:[0,10]};
  for(const [field,[min,max]] of Object.entries(ranges)){if(form[field]!==''&&form[field]!=null){const value=Number(form[field]);if(!Number.isFinite(value)||value<min||value>max)errors.push(`${field} fora do intervalo aceito.`);}}
  return errors;
}

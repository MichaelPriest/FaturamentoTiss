export function isValidCpf(input){
  const cpf=String(input||'').replace(/\D/g,'');
  if(!/^\d{11}$/.test(cpf)||/^(\d)\1{10}$/.test(cpf)) return false;
  const digit=size=>{let sum=0;for(let i=0;i<size;i++)sum+=Number(cpf[i])*(size+1-i);const value=(sum*10)%11;return value===10?0:value;};
  return digit(9)===Number(cpf[9])&&digit(10)===Number(cpf[10]);
}
export function validatePatientRegistration(form){
  const errors=[];
  if((form.nome||'').trim().split(/\s+/).length<2) errors.push('Informe o nome completo.');
  if(!isValidCpf(form.cpf)) errors.push('Informe um CPF válido.');
  if(!form.data_nascimento) errors.push('Informe a data de nascimento.');
  if(!form.telefone) errors.push('Informe um telefone.');
  if(form.modalidade_pagamento==='CONVENIO'&&(!form.convenio_id||!(form.numero_carteirinha||'').trim())) errors.push('Selecione o convênio e informe a carteirinha.');
  return errors;
}

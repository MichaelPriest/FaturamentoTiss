import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function Configuracoes() {
  const [config, setConfig] = useState({
    nome_empresa: 'Minha Clinica',
    nome_contratado: 'MINHA CLiNICA LTDA',
    cnpj: '',
    codigo_prestador: '',
    registro_ans: '',
    versao_tiss: '4.02.00',
    ambiente: 'homologacao',
    cnes: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('config_sistema');
    if (stored) setConfig(JSON.parse(stored));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!config.codigo_prestador || !config.registro_ans) {
      toast.error('Código do prestador e Registro ANS são obrigatórios');
      return;
    }
    if (!config.nome_contratado) {
      toast.error('Nome do contratado (clínica/hospital) é obrigatório');
      return;
    }
    localStorage.setItem('config_sistema', JSON.stringify(config));
    toast.success('Configurações salvas!');
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Configurações</h2>

      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Dados da Clínica / Hospital</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome da Clínica/Hospital *</label>
            <input 
              type="text" 
              placeholder="Ex: HOSPITAL E MATERNIDADE VIDAS LTDA" 
              value={config.nome_contratado} 
              onChange={e => setConfig({...config, nome_contratado: e.target.value.toUpperCase()})} 
              className="w-full border rounded-lg px-3 py-1.5 text-sm" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">CNPJ da Clínica</label>
            <input type="text" placeholder="00.000.000/0000-00" value={config.cnpj} onChange={e => setConfig({...config, cnpj: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">CNES</label>
            <input type="text" placeholder="Código CNES" value={config.cnes} onChange={e => setConfig({...config, cnes: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Dados para Faturamento TISS</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Código do Prestador *</label>
                <input type="text" placeholder="Código na operadora" value={config.codigo_prestador} onChange={e => setConfig({...config, codigo_prestador: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Registro ANS *</label>
                <input type="text" placeholder="Registro ANS da operadora" value={config.registro_ans} onChange={e => setConfig({...config, registro_ans: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Versão TISS</label>
                <select value={config.versao_tiss} onChange={e => setConfig({...config, versao_tiss: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm">
                  <option value="4.02.00">TISS 4.02.00</option>
                  <option value="4.01.00">TISS 4.01.00</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ambiente</label>
                <select value={config.ambiente} onChange={e => setConfig({...config, ambiente: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm">
                  <option value="homologacao">Homologação (Testes)</option>
                  <option value="producao">Produção</option>
                </select>
              </div>
            </div>
          </div>
          
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm w-full hover:bg-blue-700 mt-4">Salvar Configurações</button>
        </form>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { setConfig, setVersao, VERSAO_TISS } from '../lib/tissGenerator';

export default function Configuracoes() {
  const [config, setConfig] = useState({
    nome_empresa: 'Minha Clínica',
    nome_contratado: 'MINHA CLÍNICA LTDA',
    cnpj: '',
    codigo_prestador: '',
    registro_ans: '',
    versao_tiss: '4.03.00',
    ambiente: 'homologacao',
    cnes: '',
    conselho_clinica: '06',
    uf_clinica: 'SP',
    cbos_clinica: '225125'
  });

  useEffect(() => {
    const stored = localStorage.getItem('config_sistema');
    if (stored) {
      const parsed = JSON.parse(stored);
      setConfig(parsed);
      setVersao(parsed.versao_tiss || '4.03.00');
    }
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
    setConfig(config);
    setVersao(config.versao_tiss);
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
            <input type="text" value={config.nome_contratado} onChange={e => setConfig({...config, nome_contratado: e.target.value.toUpperCase()})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CNPJ da Clínica</label>
              <input type="text" value={config.cnpj} onChange={e => setConfig({...config, cnpj: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CNES</label>
              <input type="text" value={config.cnes} onChange={e => setConfig({...config, cnes: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Versão do Padrão TISS</h4>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="versao" value="4.01.00" checked={config.versao_tiss === '4.01.00'} onChange={e => setConfig({...config, versao_tiss: e.target.value})} className="w-4 h-4" />
                <span className="text-sm">TISS 4.01.00</span>
              </label>
              <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="versao" value="4.02.00" checked={config.versao_tiss === '4.02.00'} onChange={e => setConfig({...config, versao_tiss: e.target.value})} className="w-4 h-4" />
                <span className="text-sm">TISS 4.02.00</span>
              </label>
              <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="versao" value="4.03.00" checked={config.versao_tiss === '4.03.00'} onChange={e => setConfig({...config, versao_tiss: e.target.value})} className="w-4 h-4" />
                <span className="text-sm">TISS 4.03.00</span>
              </label>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Dados para Faturamento TISS</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Código do Prestador *</label>
                <input type="text" value={config.codigo_prestador} onChange={e => setConfig({...config, codigo_prestador: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Registro ANS *</label>
                <input type="text" value={config.registro_ans} onChange={e => setConfig({...config, registro_ans: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ambiente</label>
                <select value={config.ambiente} onChange={e => setConfig({...config, ambiente: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm">
                  <option value="homologacao">Homologação (Testes)</option>
                  <option value="producao">Produção</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Conselho da Clínica</label>
                <select value={config.conselho_clinica} onChange={e => setConfig({...config, conselho_clinica: e.target.value})} className="w-full border rounded-lg px-3 py-1.5 text-sm">
                  <option value="06">CRM - 06</option>
                  <option value="08">CRO - 08</option>
                  <option value="03">CRF - 03</option>
                  <option value="02">COREN - 02</option>
                  <option value="05">CREFITO - 05</option>
                  <option value="09">CRP - 09</option>
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

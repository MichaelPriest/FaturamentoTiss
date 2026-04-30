// No componente Agendamentos, atualize a seção da sala:

{/* Sala com busca */}
<div className="relative">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Sala
  </label>
  <input
    type="text"
    placeholder="Digite o nome da sala..."
    value={salaBusca}
    onChange={(e) => {
      setSalaBusca(e.target.value);
      setShowSalaList(true);
      if (e.target.value === '') setFormData({...formData, sala_id: ''});
    }}
    onFocus={() => setShowSalaList(true)}
    className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
    autoComplete="off"
  />
  {showSalaList && salasFiltradas.length > 0 && (
    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {salasFiltradas.map(s => (
        <div
          key={s.id}
          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-b-0 flex items-center justify-between"
          onClick={() => {
            setFormData({...formData, sala_id: s.id.toString()});
            setSalaBusca(s.nome);
            setShowSalaList(false);
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.cor }}></div>
            <span className="text-gray-800 dark:text-white">{s.nome}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">({s.tipo})</span>
          </div>
          <div className={`text-xs px-2 py-0.5 rounded-full ${s.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {s.ativo ? 'Ativa' : 'Inativa'}
          </div>
        </div>
      ))}
    </div>
  )}
  {salasFiltradas.length === 0 && salaBusca && (
    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-3 text-center text-gray-500 text-sm">
      Nenhuma sala encontrada
    </div>
  )}
</div>

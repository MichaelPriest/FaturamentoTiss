const getAgendamentosPorData = (data) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    return getAgendamentosFiltrados().filter(a => {
      // Normalize the date from database to handle timezone issues
      const agendamentoDate = a.data_agendamento?.split('T')[0] || '';
      return agendamentoDate === dataStr;
    });
  };
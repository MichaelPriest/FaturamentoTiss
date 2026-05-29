-- Guarda dados cadastrais do paciente na guia para impressão/histórico independente do convênio atual
ALTER TABLE public.atendimentos
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS data_nascimento date;

CREATE INDEX IF NOT EXISTS idx_atendimentos_paciente_id_data
  ON public.atendimentos (paciente_id, data_atendimento DESC);

CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente_id_data
  ON public.agendamentos (paciente_id, data_agendamento DESC);

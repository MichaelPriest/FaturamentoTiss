import { normalizeProcedureSearch } from './procedureLaunchRules.js';

const SPECIALTY_TERMS = {
  psicologia: ['psicologia', 'psicologo', 'psicoterapia', 'terapia cognitiva', 'avaliacao psicologica'],
  psiquiatria: ['psiquiatria', 'psiquiatrico', 'saude mental'],
  cardiologia: ['cardiologia', 'cardiaco', 'coracao', 'eletrocardiograma', 'ecocardiograma'],
  neurologia: ['neurologia', 'neurologico', 'eletroencefalograma'],
  ortopedia: ['ortopedia', 'ortopedico', 'fratura', 'articulacao'],
  pediatria: ['pediatria', 'pediatrico', 'crianca'],
  ginecologia: ['ginecologia', 'ginecologico', 'colposcopia'],
  dermatologia: ['dermatologia', 'dermatologico', 'pele'],
  oftalmologia: ['oftalmologia', 'oftalmologico', 'ocular', 'olho'],
  odontologia: ['odontologia', 'odontologico', 'dentario'],
  fisioterapia: ['fisioterapia', 'fisioterapico', 'reabilitacao'],
  fonoaudiologia: ['fonoaudiologia', 'fonoaudiologico', 'audiometria'],
  nutricao: ['nutricao', 'nutricional', 'nutricionista']
};

function specialtyName(relation) {
  return normalizeProcedureSearch(relation?.especialidade?.nome || relation?.nome || '');
}

export function inferProcedureSpecialties(procedure = {}) {
  const source = normalizeProcedureSearch(`${procedure.nome || ''} ${procedure.grupo || ''} ${procedure.tipo || ''}`);
  const inferred = [];

  Object.entries(SPECIALTY_TERMS).forEach(([specialty, terms]) => {
    if (terms.some(term => source.includes(normalizeProcedureSearch(term)))) inferred.push(specialty);
  });

  return inferred;
}

export function rankProfessionalsForProcedure(professionals = [], procedure = {}) {
  const inferred = inferProcedureSpecialties(procedure);
  if (!inferred.length) return professionals.map(professional => ({ ...professional, recommendationScore: 0 }));

  const ranked = professionals
    .map(professional => {
      const specialties = professional.especialidades || [];
      const matches = specialties.filter(relation => inferred.some(term => specialtyName(relation).includes(term)));
      const principalMatch = matches.some(relation => relation.principal);
      return {
        ...professional,
        recommendationScore: matches.length * 10 + (principalMatch ? 5 : 0),
        recommendationReason: matches[0]?.especialidade?.nome || matches[0]?.nome || ''
      };
    })
    .filter(professional => professional.recommendationScore > 0)
    .sort((a, b) => b.recommendationScore - a.recommendationScore || a.nome.localeCompare(b.nome));

  return ranked.length > 0
    ? ranked
    : professionals.map(professional => ({ ...professional, recommendationScore: 0, recommendationFallback: true }));
}

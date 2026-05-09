// src/components/autorizacoes/ResumoAutorizacao.jsx
import { 
  CheckCircleIcon, XCircleIcon, ClockIcon, 
  ExclamationTriangleIcon, CurrencyDollarIcon 
} from '@heroicons/react/24/outline';

export default function ResumoAutorizacao({ estatisticas }) {
  const cards = [
    {
      titulo: 'Autorizações Ativas',
      valor: estatisticas?.ativas || 0,
      icon: CheckCircleIcon,
      cor: 'green',
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    },
    {
      titulo: 'Expiradas',
      valor: estatisticas?.expiradas || 0,
      icon: ClockIcon,
      cor: 'red',
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800'
    },
    {
      titulo: 'Canceladas',
      valor: estatisticas?.canceladas || 0,
      icon: XCircleIcon,
      cor: 'gray',
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-700'
    },
    {
      titulo: 'Próximas ao Vencimento',
      valor: estatisticas?.proximasVencer || 0,
      icon: ExclamationTriangleIcon,
      cor: 'yellow',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    {
      titulo: 'Valor Total Autorizado',
      valor: `R$ ${(estatisticas?.valorTotal || 0).toFixed(2)}`,
      icon: CurrencyDollarIcon,
      cor: 'purple',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`bg-white dark:bg-gray-800 rounded-xl border ${card.border} p-4 hover:shadow-lg transition-all duration-300`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {card.titulo}
              </p>
              <p className={`text-2xl font-bold mt-1 ${card.text}`}>
                {card.valor}
              </p>
            </div>
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.text}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

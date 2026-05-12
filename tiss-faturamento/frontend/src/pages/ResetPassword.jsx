// src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { KeyIcon, CheckCircleIcon, ArrowPathIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Log para debug
    console.log('📍 [ResetPassword] Pathname:', location.pathname);
    console.log('📍 [ResetPassword] Search:', location.search);
    console.log('📍 [ResetPassword] Hash:', location.hash);
    
    // Ler os parâmetros da URL
    const queryParams = new URLSearchParams(location.search);
    const tokenHash = queryParams.get('token_hash');
    const type = queryParams.get('type');
    
    console.log('🔑 [ResetPassword] Token Hash:', tokenHash);
    console.log('📝 [ResetPassword] Type:', type);
    
    if (!tokenHash || type !== 'recovery') {
      console.error('❌ [ResetPassword] Link inválido ou tipo incorreto');
      setError('Link de recuperação inválido ou expirado');
      toast.error('Link de recuperação inválido ou expirado');
      setTimeout(() => navigate('/login'), 3000);
    } else {
      console.log('✅ [ResetPassword] Token válido encontrado');
      setToken(tokenHash);
    }
  }, [location, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!novaSenha || !confirmarSenha) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔄 [ResetPassword] Atualizando senha...');
      
      // Atualizar a senha do usuário
      // O Supabase usa o token_hash da URL para autenticar esta operação
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });
      
      if (error) {
        console.error('❌ [ResetPassword] Erro ao atualizar:', error);
        
        if (error.message?.includes('expired')) {
          toast.error('Link expirado. Solicite uma nova recuperação de senha.');
        } else if (error.message?.includes('Invalid')) {
          toast.error('Link inválido. Solicite uma nova recuperação.');
        } else {
          toast.error(error.message || 'Erro ao alterar senha');
        }
        return;
      }
      
      console.log('✅ [ResetPassword] Senha alterada com sucesso!');
      toast.success('Senha alterada com sucesso! Faça login com sua nova senha.');
      
      // Aguardar um pouco e redirecionar para o login
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('❌ [ResetPassword] Erro inesperado:', error);
      toast.error('Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Se houver erro, mostrar mensagem
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 text-center max-w-md">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Inválido</h1>
          <p className="text-blue-200 mb-4">{error}</p>
          <p className="text-blue-200 text-sm">Redirecionando para o login...</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 text-sm text-white underline hover:text-blue-200 transition-colors"
          >
            Ir para o login agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <KeyIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Nova Senha</h1>
            <p className="text-blue-200 text-sm">Digite sua nova senha para acessar o sistema</p>
          </div>
          
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* Campo Nova Senha */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-blue-200 pr-12"
                  placeholder="Digite sua nova senha"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-blue-200 hover:text-white transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-blue-200 hover:text-white transition-colors" />
                  )}
                </button>
              </div>
              <p className="text-xs text-blue-200 mt-1">
                Mínimo de 6 caracteres
              </p>
            </div>
            
            {/* Campo Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-blue-200 pr-12"
                  placeholder="Confirme sua nova senha"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-blue-200 hover:text-white transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-blue-200 hover:text-white transition-colors" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Botão Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Alterando senha...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Alterar Senha
                </>
              )}
            </button>
          </form>
          
          {/* Link para voltar ao login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-200 hover:text-white transition-colors"
            >
              ← Voltar para o login
            </button>
          </div>
          
          {/* Informação de segurança */}
          <div className="mt-6 p-3 bg-white/5 rounded-xl">
            <p className="text-xs text-blue-200 text-center">
              🔒 Este link expira em 24 horas por segurança
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

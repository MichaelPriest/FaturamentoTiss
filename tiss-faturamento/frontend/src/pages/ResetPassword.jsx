// src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [hash, setHash] = useState(null);

  useEffect(() => {
    // Extrair hash da URL (token de recuperação)
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken) {
      setHash(accessToken);
    } else {
      toast.error('Link de recuperação inválido ou expirado');
      navigate('/login');
    }
  }, [location, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
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
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });
      
      if (error) throw error;
      
      toast.success('Senha alterada com sucesso! Faça login com sua nova senha.');
      navigate('/login');
      
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <KeyIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Nova Senha</h1>
            <p className="text-blue-200 text-sm">Digite sua nova senha</p>
          </div>
          
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Nova Senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-blue-200"
                placeholder="********"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Confirmar Senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-blue-200"
                placeholder="********"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <CheckCircleIcon className="w-5 h-5" />
              )}
              Alterar Senha
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

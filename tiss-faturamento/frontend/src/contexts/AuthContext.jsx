// contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      const sessao = localStorage.getItem('tiss_sessao');
      if (sessao) {
        try {
          const sessaoData = JSON.parse(sessao);
          if (sessaoData.logado && sessaoData.user) {
            setUser(sessaoData.user);
          }
        } catch (e) {
          console.error('Erro ao parsear sessão:', e);
          localStorage.removeItem('tiss_sessao');
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const signIn = async (email, senha) => {
    if (!supabase) {
      toast.error('Supabase não disponível');
      return { success: false };
    }
    
    try {
      console.log('Tentando login com:', email);
      
      // Buscar na tabela usuarios
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('ativo', true)
        .single();

      if (error) {
        console.error('Erro ao buscar usuário:', error);
        toast.error('Usuário não encontrado');
        return { success: false };
      }

      console.log('Usuário encontrado:', data?.nome);

      // Verificar senha
      if (data && data.senha === senha) {
        // Atualizar último acesso
        await supabase
          .from('usuarios')
          .update({ ultimo_acesso: new Date().toISOString() })
          .eq('id', data.id);

        const userData = {
          id: data.id,
          email: data.email,
          nome: data.nome,
          perfil: data.perfil
        };

        const sessao = { 
          user: userData, 
          logado: true, 
          data_hora: new Date().toISOString() 
        };
        
        localStorage.setItem('tiss_sessao', JSON.stringify(sessao));
        
        setUser(userData);
        toast.success(`Bem-vindo, ${data.nome}!`);
        return { success: true, user: userData };
      } else {
        toast.error('Senha incorreta!');
        return { success: false, error: 'Senha incorreta' };
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error(error.message || 'Erro ao fazer login');
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('tiss_sessao');
      setUser(null);
      toast.success('Logout realizado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error(error.message || 'Erro ao fazer logout');
      return { success: false };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

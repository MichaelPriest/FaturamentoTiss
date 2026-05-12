// contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // Função para carregar perfil do usuário
  const loadUserProfile = useCallback(async (userId, email, metadata = {}) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', userError);
      }

      if (userData) {
        // Usuário existe na tabela
        return {
          id: userData.id,
          email: userData.email,
          nome: userData.nome,
          role: userData.role || 'usuario',
          foto: userData.foto,
        };
      } else {
        // Criar perfil automaticamente
        const nome = metadata?.nome || email?.split('@')[0] || 'Usuário';
        
        const { data: newUser, error: createError } = await supabase
          .from('usuarios')
          .insert({
            id: userId,
            email: email,
            nome: nome,
            role: 'usuario',
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Erro ao criar perfil:', createError);
          return null;
        }

        return {
          id: newUser.id,
          email: newUser.email,
          nome: newUser.nome,
          role: newUser.role || 'usuario',
        };
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      return null;
    }
  }, []);

  // Verificar sessão inicial - executado apenas uma vez
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const checkSession = async () => {
      try {
        setLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          setUser(null);
          setLoading(false);
          return;
        }

        if (session) {
          const profile = await loadUserProfile(
            session.user.id, 
            session.user.email,
            session.user.user_metadata
          );
          
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erro:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session) {
        const profile = await loadUserProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata
        );
        setUser(profile);
        setLoading(false);
      } else if (event === 'USER_UPDATED' && session) {
        // Atualizar dados do usuário
        const profile = await loadUserProfile(
          session.user.id,
          session.user.email,
          session.user.user_metadata
        );
        setUser(profile);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = async (email, password) => {
    if (!supabase) {
      toast.error('Supabase não disponível');
      return { success: false };
    }
    
    try {
      console.log('🔐 [AuthContext] Tentando login com:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ [AuthContext] Erro no login:', error);
        setLoading(false);
        
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('Email ou senha inválidos');
        } else if (error.message?.includes('Email not confirmed')) {
          toast.error('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          toast.error(error.message || 'Erro ao fazer login');
        }
        
        return { success: false, error: error.message };
      }

      console.log('✅ [AuthContext] Login bem-sucedido!');
      
      const profile = await loadUserProfile(
        data.user.id,
        data.user.email,
        data.user.user_metadata
      );
      
      setUser(profile);
      setLoading(false);
      toast.success(`Bem-vindo, ${profile?.nome || 'Usuário'}!`);
      
      return { success: true, user: profile };
    } catch (error) {
      console.error('❌ [AuthContext] Erro inesperado:', error);
      setLoading(false);
      toast.error(error.message || 'Erro ao fazer login');
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      toast.success('Logout realizado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error(error.message || 'Erro ao fazer logout');
      return { success: false };
    } finally {
      setLoading(false);
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

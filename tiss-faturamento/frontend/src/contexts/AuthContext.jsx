// contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual no Supabase Auth
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          // Buscar dados adicionais do perfil na tabela usuarios
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (userError && userError.code !== 'PGRST116') {
            console.error('Erro ao buscar perfil:', userError);
          }
          
          setUser({
            id: session.user.id,
            email: session.user.email,
            nome: userData?.nome || session.user.user_metadata?.nome || session.user.email?.split('@')[0],
            role: userData?.role || 'usuario',
            ...userData
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
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
      } else if (event === 'SIGNED_IN' && session) {
        // Buscar dados do perfil
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (userError && userError.code !== 'PGRST116') {
          console.error('Erro ao buscar perfil:', userError);
        }
        
        setUser({
          id: session.user.id,
          email: session.user.email,
          nome: userData?.nome || session.user.user_metadata?.nome || session.user.email?.split('@')[0],
          role: userData?.role || 'usuario',
          ...userData
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    if (!supabase) {
      toast.error('Supabase não disponível');
      return { success: false };
    }
    
    try {
      console.log('🔐 [AuthContext] Tentando login com:', email);
      
      // Usar o Supabase Auth para autenticar
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ [AuthContext] Erro no login:', error);
        
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
      
      // Buscar dados adicionais na tabela usuarios
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      // Se o usuário não existe na tabela, criar um registro
      if (userError && userError.code === 'PGRST116') {
        console.log('📝 [AuthContext] Criando perfil para usuário...');
        
        const { data: newUser, error: createError } = await supabase
          .from('usuarios')
          .insert({
            id: data.user.id,
            email: data.user.email,
            nome: data.user.user_metadata?.nome || email.split('@')[0],
            role: 'usuario',
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ [AuthContext] Erro ao criar perfil:', createError);
        } else {
          setUser({
            id: newUser.id,
            email: newUser.email,
            nome: newUser.nome,
            role: newUser.role
          });
          
          toast.success(`Bem-vindo, ${newUser.nome}!`);
          return { success: true, user: newUser };
        }
      } else if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          nome: userData.nome,
          role: userData.role
        });
        
        toast.success(`Bem-vindo, ${userData.nome}!`);
        return { success: true, user: userData };
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ [AuthContext] Erro inesperado:', error);
      toast.error(error.message || 'Erro ao fazer login');
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
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

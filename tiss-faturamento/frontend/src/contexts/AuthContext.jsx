// contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

const AuthContext = createContext({});

const profileFromAuthUser = (authUser) => ({
  id: authUser.id,
  email: authUser.email,
  nome: authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuário',
  // Papéis de acesso nunca são aceitos de metadata controlada pelo cliente.
  role: 'usuario',
  foto: authUser.user_metadata?.foto || null,
  empresa_id: null,
  unidade_id: null,
  saas_admin: false,
  setor_acesso: 'recepcao',
  nivel_acesso: 'operador',
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const profileRequestId = useRef(0);

  // Função para carregar perfil do usuário
  const loadUserProfile = useCallback(async (authUserOrId, email, metadata = {}) => {
    const authUser = typeof authUserOrId === 'object'
      ? authUserOrId
      : { id: authUserOrId, email, user_metadata: metadata };
    const fallbackProfile = profileFromAuthUser(authUser);

    if (!supabase) return fallbackProfile;
    try {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', userError);
        return fallbackProfile;
      }

      const { data: saasAdmin } = await supabase
        .from('saas_administradores')
        .select('usuario_id')
        .eq('usuario_id', authUser.id)
        .maybeSingle();
      fallbackProfile.saas_admin = Boolean(saasAdmin);

      if (userData) {
        // Usuário existe na tabela
        return {
          id: userData.id,
          email: userData.email || fallbackProfile.email,
          nome: userData.nome || fallbackProfile.nome,
          role: userData.role || fallbackProfile.role,
          foto: userData.foto || fallbackProfile.foto,
          empresa_id: userData.empresa_id,
          unidade_id: userData.unidade_id,
          saas_admin: Boolean(saasAdmin),
          setor_acesso: userData.setor_acesso || (userData.role === 'admin' ? 'todos' : 'recepcao'),
          nivel_acesso: userData.nivel_acesso || (userData.role === 'admin' ? 'administrador' : 'operador'),
        };
      }

      // Criar perfil automaticamente. Se a criação falhar por RLS/permissão,
      // ainda mantemos o usuário autenticado com os dados vindos do Supabase Auth.
      const { data: newUser, error: createError } = await supabase
        .from('usuarios')
        .insert({
          id: authUser.id,
          email: fallbackProfile.email,
          nome: fallbackProfile.nome,
          role: 'usuario',
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar perfil:', createError);
        return fallbackProfile;
      }

      return {
        id: newUser.id,
        email: newUser.email || fallbackProfile.email,
        nome: newUser.nome || fallbackProfile.nome,
        role: newUser.role || fallbackProfile.role,
        foto: newUser.foto || fallbackProfile.foto,
        empresa_id: newUser.empresa_id,
        unidade_id: newUser.unidade_id,
        saas_admin: Boolean(saasAdmin),
        setor_acesso: newUser.setor_acesso || 'recepcao',
        nivel_acesso: newUser.nivel_acesso || 'operador',
      };
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      return fallbackProfile;
    }
  }, []);

  const applySession = useCallback(async (session, { updateLoading = true } = {}) => {
    const requestId = ++profileRequestId.current;

    if (!session?.user) {
      setUser(null);
      if (updateLoading) setLoading(false);
      return null;
    }

    if (updateLoading) setLoading(true);
    const profile = await loadUserProfile(session.user);

    if (requestId === profileRequestId.current) {
      setUser(profile);
      if (updateLoading) setLoading(false);
    }

    return profile;
  }, [loadUserProfile]);

  // Verificar sessão inicial - executado apenas uma vez
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const checkSession = async () => {
      if (!supabase) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Erro ao verificar sessão:', error);
          setUser(null);
          return;
        }

        await applySession(session);
      } catch (error) {
        console.error('Erro:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escutar mudanças na autenticação. O callback do Supabase não deve aguardar
    // outras chamadas Supabase diretamente; agendamos o carregamento do perfil
    // fora do callback para evitar travamentos/loops de autenticação.
    if (!supabase) return undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_OUT') {
        profileRequestId.current += 1;
        setUser(null);
        setLoading(false);
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') && session) {
        setTimeout(() => {
          applySession(session, { updateLoading: event !== 'TOKEN_REFRESHED' });
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = async (email, password) => {
    if (!supabase) {
      const message = 'Configuração do Supabase ausente. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente de publicação.';
      console.error('[AuthContext]', message);
      toast.error(message);
      return { success: false, error: message, code: 'SUPABASE_NOT_CONFIGURED' };
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

      const profile = await applySession(data.session || { user: data.user });
      toast.success(`Bem-vindo, ${profile?.nome || 'Usuário'}!`);

      return { success: true, user: profile };
    } catch (error) {
      console.error('❌ [AuthContext] Erro inesperado:', error);
      setLoading(false);
      toast.error(error.message || 'Erro ao fazer login');
      return { success: false, error: error?.message || 'Erro inesperado ao fazer login', code: error?.code };
    }
  };

  const signOut = async () => {
    if (!supabase) return { success: true };
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      profileRequestId.current += 1;
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

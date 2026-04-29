import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const sessao = localStorage.getItem('tiss_sessao');
  const isLoggedIn = sessao ? JSON.parse(sessao).logado : false;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

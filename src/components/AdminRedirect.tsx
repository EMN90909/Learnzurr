import { useAuth } from './auth/AuthProvider';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DominoLoader from './DominoLoader';

export const AdminRedirect = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (profile?.isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [profile?.isAdmin, loading, navigate]);

  return <DominoLoader message="Checking admin access..." fullscreen />;
};

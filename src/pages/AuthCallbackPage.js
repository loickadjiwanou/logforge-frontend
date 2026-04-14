import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'sonner';
import api from '../lib/api';
import { loadAppSettings } from '../lib/appColors';
import { Shield } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { LogLoader } from '../components/ui/log-loader';

export default function AuthCallbackPage() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const processed = useRef(false);
  const { appSettings, lang } = useLanguage();

  useEffect(() => {
    if (processed.current) return;
    
    const code = searchParams.get('code');
    if (!code) {
      toast.error('No authorization code received');
      navigate('/login');
      return;
    }

    const exchangeCode = async () => {
      processed.current = true;
      try {
        const response = await api.get(`/auth/${provider}/callback?code=${code}`);
        const { access_token, user } = response.data;
        
        loginWithToken(access_token, user);
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/dashboard');
      } catch (err) {
        console.error('OAuth exchange error:', err);
        toast.error(err.response?.data?.detail || 'Authentication failed');
        navigate('/login');
      }
    };

    exchangeCode();
  }, [provider, searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-screen bg-[hsl(240,6%,7%)] flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
        <h1 className="font-mono font-bold text-3xl tracking-tight text-white">{appSettings?.app_name || 'LogForge'}</h1>
      </div>
      
      <div className="flex flex-col items-center w-full max-w-md">
        <LogLoader text={lang === 'fr' ? `Authentification ${provider}` : `Authenticating ${provider}`} />
      </div>
    </div>
  );
}

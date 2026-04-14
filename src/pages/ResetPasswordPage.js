import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Shield, Loader2, CheckCircle2, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../lib/LanguageContext';
import api from '../lib/api';

export default function ResetPasswordPage() {
  const { t, appSettings } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error(t('resetPasswordError'));
      navigate('/login');
    }
  }, [token, navigate, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }
    if (password.length < 8) {
      toast.error(t('passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { 
        token, 
        new_password: password 
      });
      setSuccess(true);
      toast.success(t('passwordUpdatedTitle'));
    } catch (err) {
      toast.error(err.response?.data?.detail || t('resetPasswordError'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
            <h1 className="font-mono font-bold text-2xl tracking-tight text-heading">{appSettings?.app_name || 'LogForge'}</h1>
          </div>

          <Card className="auth-card text-center py-4">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              <CardTitle className="text-xl font-semibold text-heading">{t('passwordUpdatedTitle')}</CardTitle>
              <CardDescription className="text-muted-foreground pt-2">
                {t('passwordUpdatedDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/login">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  {t('signIn')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
          <h1 className="font-mono font-bold text-2xl tracking-tight text-heading">{appSettings?.app_name || 'LogForge'}</h1>
        </div>

        <Card className="auth-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-heading">{t('resetPassword')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t('newPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="pl-10 bg-zinc-900/50 border-zinc-800 text-heading placeholder:text-zinc-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword" type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="pl-10 bg-zinc-900/50 border-zinc-800 text-heading placeholder:text-zinc-500"
                  />
                </div>
              </div>
              <Button
                type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t('updatePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

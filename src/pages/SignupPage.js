import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Info } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { ChangelogModal } from '../components/layout/changelog-modal';

export default function SignupPage() {
  const { t, lang, appSettings } = useLanguage();
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" data-testid="signup-page">
      <div className="auth-container">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
          <h1 className="font-mono font-bold text-2xl tracking-tight text-heading">{appSettings?.app_name || 'LogForge'}</h1>
        </div>

        <Card className="auth-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-heading">{t('signup')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('integrateLogForge')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">{t('name')}</Label>
                <Input
                  id="name" type="text" value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" required
                  data-testid="signup-name-input"
                  className="bg-zinc-900/50 border-zinc-800 text-heading placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
                <Input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  data-testid="signup-email-input"
                  className="bg-zinc-900/50 border-zinc-800 text-heading placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
                <Input
                  id="password" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters" required
                  data-testid="signup-password-input"
                  className="bg-zinc-900/50 border-zinc-800 text-heading placeholder:text-zinc-500"
                />
              </div>
              <Button
                type="submit" disabled={loading}
                data-testid="signup-submit-btn"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t('signup')}
              </Button>
            </form>
            <p className="text-center text-xs text-zinc-500 mt-6">
              {t('alreadyHaveAccount')}{' '}
              <Link to="/login" className="text-emerald-500 hover:text-emerald-400" data-testid="login-link">
                {t('signIn')}
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-2">
          <button 
            onClick={() => setChangelogOpen(true)}
            className="text-[11px] text-zinc-500 hover:text-emerald-500 transition-colors flex items-center justify-center gap-1.5 w-full font-medium"
          >
            <Info className="w-3.5 h-3.5" />
            {t('version')}: v0.1.8
          </button>
          <p className="text-[11px] text-zinc-600 font-medium">
               {appSettings?.app_name || 'LogForge'} v0.1.8 • {new Date().getFullYear()}.<br/>{lang === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
      <ChangelogModal open={changelogOpen} onOpenChange={setChangelogOpen} />
    </div>
  );
}

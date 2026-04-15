import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Loader2, Building2, ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const GithubIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const GitlabIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="m23.6 9.593-.033-.086L20.3.98a.851.851 0 0 0-.336-.405.875.875 0 0 0-1 .054.875.875 0 0 0-.29.44l-2.206 6.748H7.538L5.332 1.069a.857.857 0 0 0-.29-.441.875.875 0 0 0-1-.054.859.859 0 0 0-.336.405L.433 9.502l-.032.086a6.066 6.066 0 0 0 2.012 7.01l.011.01.03.022 4.948 3.706 2.448 1.853 1.49 1.127a1.015 1.015 0 0 0 1.228 0l1.49-1.127 2.449-1.853 4.978-3.728.012-.01a6.068 6.068 0 0 0 2.01-7.003z"/>
  </svg>
);

import { useLanguage } from '../lib/LanguageContext';
import { ChangelogModal } from '../components/layout/changelog-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import api from '../lib/api';
import { Info, Mail } from 'lucide-react';
import BackendConfig from '../components/ui/backend-config';

export default function LoginPage() {
  const { t, lang, appSettings } = useLanguage();
  const [contactAdminOpen, setContactAdminOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);

  // 3-step login state
  const [step, setStep] = useState('email'); // 'email' | 'select_company' | 'password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Step 1: email lookup
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/email-lookup', { email });
      const found = res.data.companies || [];
      if (found.length === 0) {
        // Don't reveal if account exists — go to password with no company (will fail at login)
        setStep('password');
      } else if (found.length === 1) {
        setSelectedCompany(found[0]);
        setStep('password');
      } else {
        setCompanies(found);
        setStep('select_company');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: select company
  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setStep('password');
  };

  // Step 3: password + sign in
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, selectedCompany?.id || null);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      const response = await api.get(`/auth/${provider}`);
      if (response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      } else {
        toast.error(`Failed to get ${provider} redirect URL`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || `OAuth initialization failed for ${provider}`);
    }
  };

  const Logo = () => (
    <div className="flex items-center gap-3 mb-8">
      {appSettings?.logo_url
        ? <img src={appSettings.logo_url} alt="logo" className="w-8 h-8 object-contain rounded" />
        : <img src={`${process.env.PUBLIC_URL}/app-icon.png`} alt="LogForge" className="w-8 h-8 object-contain rounded" />}
      <h1 className="font-mono font-bold text-2xl tracking-tight text-heading">
        {appSettings?.app_name || 'LogForge'}
      </h1>
    </div>
  );

  // ── Step 1: Email ──────────────────────────────────────────────────────────
  if (step === 'email') {
    return (
      <div className="auth-page" data-testid="login-page">
        <div className="auth-container" style={{ position: 'relative' }}>
          <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 50 }}>
            <BackendConfig />
          </div>
          <Logo />
          <Card className="auth-card">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-semibold text-heading">{t('signIn')}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {t('accessDashboard')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
                  <Input
                    id="email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" required autoFocus
                    data-testid="login-email-input"
                    className="bg-zinc-900/50 border-zinc-800 text-heading placeholder:text-zinc-500"
                  />
                </div>
                <Button
                  type="submit" disabled={loading}
                  data-testid="login-email-continue-btn"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {lang === 'fr' ? 'Continuer' : 'Continue'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline" onClick={() => handleOAuth('github')}
                  data-testid="login-github-btn"
                  className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
                >
                  <GithubIcon /> <span className="ml-2">GitHub</span>
                </Button>
                <Button
                  variant="outline" onClick={() => handleOAuth('gitlab')}
                  data-testid="login-gitlab-btn"
                  className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/50 hover:text-white"
                >
                  <GitlabIcon /> <span className="ml-2">GitLab</span>
                </Button>
              </div>

              <p className="text-center text-xs text-zinc-500 mt-6">
                {t('dontHaveAccount') || "Don't have an account?"}{' '}
                <Link to="/setup" className="text-emerald-500 hover:text-emerald-400 font-medium" data-testid="create-company-link">
                  {t('createMyCompany') || 'Create my company'}
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
              {t('version')}: v0.2.0
            </button>
            <p className="text-[11px] text-zinc-600 font-medium">
              {appSettings?.app_name || 'LogForge'} v0.2.0 • {new Date().getFullYear()}.<br />
              {lang === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
        <ChangelogModal open={changelogOpen} onOpenChange={setChangelogOpen} />
      </div>
    );
  }

  // ── Step 2: Select Company ─────────────────────────────────────────────────
  if (step === 'select_company') {
    return (
      <div className="auth-page" data-testid="login-page">
        <div className="auth-container">
          <Logo />
          <Card className="auth-card">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-semibold text-heading">
                {lang === 'fr' ? 'Choisissez votre espace de travail' : 'Choose your workspace'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {lang === 'fr'
                  ? `Votre email est associé à ${companies.length} espaces de travail.`
                  : `Your email is linked to ${companies.length} workspaces.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelectCompany(company)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/70 hover:border-zinc-700 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium text-white">{company.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </button>
              ))}

              <button
                onClick={() => { setStep('email'); setCompanies([]); setSelectedCompany(null); }}
                className="w-full flex items-center justify-center gap-2 mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {lang === 'fr' ? 'Retour' : 'Back'}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Step 3: Password ───────────────────────────────────────────────────────
  return (
    <div className="auth-page" data-testid="login-page">
      <div className="auth-container">
        <Logo />
        <Card className="auth-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-heading">{t('signIn')}</CardTitle>
            {selectedCompany && (
              <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={1.5} />
                <span className="text-xs text-zinc-400">{selectedCompany.name}</span>
              </div>
            )}
            <CardDescription className="text-muted-foreground text-xs">
              {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">{t('password')}</Label>
                  <button
                    type="button"
                    onClick={() => setContactAdminOpen(true)}
                    className="text-[10px] font-medium text-emerald-500 hover:text-emerald-400"
                    data-testid="forgot-password-link"
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
                <Input
                  id="password" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" required autoFocus
                  data-testid="login-password-input"
                  className="bg-zinc-900/50 border-zinc-800 text-heading placeholder:text-zinc-500"
                />
              </div>
              <Button
                type="submit" disabled={loading}
                data-testid="login-submit-btn"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t('signIn')}
              </Button>
            </form>

            <button
              onClick={() => {
                setPassword('');
                setStep(companies.length > 1 ? 'select_company' : 'email');
              }}
              className="w-full flex items-center justify-center gap-2 mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {lang === 'fr' ? 'Retour' : 'Back'}
            </button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={contactAdminOpen} onOpenChange={setContactAdminOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-500" />
              {lang === 'fr' ? 'Récupération de mot de passe' : 'Password Recovery'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 pt-1">
              {lang === 'fr'
                ? 'La réinitialisation de mot de passe est gérée par votre administrateur.'
                : 'Password resets are managed by your workspace administrator.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {[
              {
                step: '1',
                label: lang === 'fr' ? 'Contactez votre administrateur' : 'Contact your administrator',
                desc: lang === 'fr'
                  ? 'Informez-le que vous avez besoin de réinitialiser votre mot de passe.'
                  : 'Let them know you need to reset your password.'
              },
              {
                step: '2',
                label: lang === 'fr' ? "L'admin envoie le lien" : 'Admin sends the link',
                desc: lang === 'fr'
                  ? "Depuis la page Utilisateurs, il clique sur votre compte et déclenche l'envoi d'un email de réinitialisation."
                  : 'From the Users page, they click your account and trigger a reset email.'
              },
              {
                step: '3',
                label: lang === 'fr' ? 'Vérifiez votre boîte mail' : 'Check your inbox',
                desc: lang === 'fr'
                  ? 'Vous recevrez un lien valable 1 heure pour définir un nouveau mot de passe.'
                  : "You'll receive a link valid for 1 hour to set a new password."
              }
            ].map(({ step: s, label, desc }) => (
              <div key={s} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-emerald-500">{s}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-2">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setContactAdminOpen(false)}
            >
              {lang === 'fr' ? 'Compris' : 'Got it'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

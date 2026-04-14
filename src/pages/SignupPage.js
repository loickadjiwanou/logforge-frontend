import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Shield, Loader2, Building2, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../lib/LanguageContext';
import { ChangelogModal } from '../components/layout/changelog-modal';
import api from '../lib/api';

export default function SignupPage() {
  const { t, lang, appSettings } = useLanguage();
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');

  // Invitation state
  const [invitationLoading, setInvitationLoading] = useState(true);
  const [invitationError, setInvitationError] = useState(null);
  const [companyName, setCompanyName] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  // Validate invitation token on mount
  useEffect(() => {
    if (!invitationToken) {
      setInvitationError('no_token');
      setInvitationLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const res = await api.get(`/auth/invite/validate/${invitationToken}`);
        setEmail(res.data.email);
        setCompanyName(res.data.company_name);
      } catch (err) {
        const status = err.response?.status;
        if (status === 410) {
          setInvitationError('expired');
        } else {
          setInvitationError('invalid');
        }
      } finally {
        setInvitationLoading(false);
      }
    };

    validate();
  }, [invitationToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name, invitationToken);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────
  if (invitationLoading) {
    return (
      <div className="auth-page">
        <div className="auth-container flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm text-zinc-500">{t('loadingInvitation') || 'Validating invitation...'}</p>
        </div>
      </div>
    );
  }

  // ── Invalid / missing token ────────────────────────────────
  if (invitationError) {
    return (
      <div className="auth-page" data-testid="signup-page">
        <div className="auth-container">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
            <h1 className="font-mono font-bold text-2xl tracking-tight text-heading">
              {appSettings?.app_name || 'LogForge'}
            </h1>
          </div>

          <Card className="auth-card">
            <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-base mb-1">
                  {invitationError === 'expired'
                    ? (lang === 'fr' ? 'Invitation expirée' : 'Invitation expired')
                    : (t('invalidInvitation') || 'Invalid invitation link')}
                </p>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  {lang === 'fr'
                    ? 'Ce lien d\'invitation est invalide ou a expiré. Demandez à votre administrateur de vous renvoyer une invitation.'
                    : 'This invitation link is invalid or has expired. Ask your administrator to resend your invitation.'}
                </p>
              </div>
              <Link to="/login" className="text-emerald-500 hover:text-emerald-400 text-sm font-medium mt-2">
                {t('backToLogin') || 'Back to login'}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Valid invitation — signup form ─────────────────────────
  return (
    <div className="auth-page" data-testid="signup-page">
      <div className="auth-container">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
          <h1 className="font-mono font-bold text-2xl tracking-tight text-heading">
            {appSettings?.app_name || 'LogForge'}
          </h1>
        </div>

        {/* Company banner */}
        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[11px] text-zinc-500 leading-none mb-0.5">
              {t('joiningCompany') || 'You are about to join'}
            </p>
            <p className="text-sm font-semibold text-white">{companyName}</p>
          </div>
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
                  readOnly
                  data-testid="signup-email-input"
                  className="bg-zinc-900/30 border-zinc-800 text-zinc-400 cursor-not-allowed"
                />
                <p className="text-[10px] text-zinc-600 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  {t('invitedEmailNote') || 'This email was used in your invitation and cannot be changed.'}
                </p>
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
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-2">
          <button
            onClick={() => setChangelogOpen(true)}
            className="text-[11px] text-zinc-500 hover:text-emerald-500 transition-colors flex items-center justify-center gap-1.5 w-full font-medium"
          >
            <Info className="w-3.5 h-3.5" />
            {t('version')}: v0.1.9
          </button>
          <p className="text-[11px] text-zinc-600 font-medium">
            {appSettings?.app_name || 'LogForge'} v0.1.9 • {new Date().getFullYear()}.<br />
            {lang === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
      <ChangelogModal open={changelogOpen} onOpenChange={setChangelogOpen} />
    </div>
  );
}

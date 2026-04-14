import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { User, Shield, Mail, Calendar, CheckCircle2, XCircle, Lock, Key, AlertCircle, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PERMISSIONS = [
  { key: 'manage_smtp', label: 'SMTP Config', label_fr: 'Configuration SMTP', description: 'Configure email notifications', description_fr: 'Configurer les notifications par email' },
  { key: 'manage_alert_rules', label: 'Alert Rules', label_fr: 'Règles d\'Alerte', description: 'Create & manage alert rules', description_fr: 'Créer & gérer les règles d\'alerte' },
  { key: 'delete_projects', label: 'Delete Projects', label_fr: 'Supprimer Projets', description: 'Permanently delete projects', description_fr: 'Supprimer définitivement les projets' },
  { key: 'view_docker_logs', label: 'View Docker Logs', label_fr: 'Logs Docker', description: 'Access infrastructure-wide container logs', description_fr: 'Accéder aux logs de l\'infrastructure Docker' },
];

export default function ProfilePage() {
  const { user, isAdmin, hasPermission } = useAuth();
  const { t, lang } = useLanguage();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500" data-testid="profile-page">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end gap-6 pb-2 border-b border-border/50">
        <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center shadow-2xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <User className="w-10 h-10 text-emerald-500 relative z-10" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{user?.name}</h1>
            <Badge className={isAdmin ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-muted text-muted-foreground border-border'}>
              {isAdmin ? (lang === 'fr' ? 'Administrateur' : 'Administrator') : (lang === 'fr' ? 'Membre' : 'Member')}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" /> {user?.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: General Info & Security */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-blue-500" /> {lang === 'fr' ? 'À propos' : 'About'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{lang === 'fr' ? 'Membre depuis' : 'Member since'}</p>
                <div className="flex items-center gap-2 text-foreground font-mono text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {user?.created_at ? format(parseISO(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{lang === 'fr' ? 'Dernière connexion' : 'Last activity'}</p>
                <div className="flex items-center gap-2 text-foreground font-mono text-sm">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  {lang === 'fr' ? 'Aujourd\'hui' : 'Today'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-500" /> {lang === 'fr' ? 'Sécurité' : 'Security'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-center space-y-4">
               <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-left">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-[11px] text-amber-500 leading-normal">
                      {lang === 'fr' ? 'La gestion du mot de passe sera disponible via l\'interface d\'onboarding OAuth.' : 'Password management will be available via the OAuth onboarding interface.'}
                    </p>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Roles & Permissions Detail */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xl min-h-[400px]">
             <CardHeader className="bg-muted/20 pb-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-violet-500" /> {lang === 'fr' ? 'Rôles & Permissions' : 'Roles & Permissions'}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] bg-muted/30 border-border text-muted-foreground uppercase font-mono tracking-tighter">
                        RBAC System
                    </Badge>
                </div>
                <CardDescription className="text-[11px] text-muted-foreground mt-2">
                    {lang === 'fr' 
                        ? 'Détails des droits d\'accès accordés à votre compte sur cette application.'
                        : 'Details of the access rights granted to your account on this application.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              {/* Role Box */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border flex items-start gap-4">
                <div className={`p-3 rounded-xl ${isAdmin ? 'bg-violet-500/10 text-violet-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <Shield className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-foreground font-bold leading-tight">
                        {isAdmin ? (lang === 'fr' ? 'Rôle Administrateur' : 'Administrator Role') : (lang === 'fr' ? 'Rôle Membre' : 'Member Role')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {isAdmin 
                            ? (lang === 'fr' 
                                ? 'Full Access : Vous avez un contrôle total sur les paramètres, les utilisateurs et tous les projets de l\'instance.' 
                                : 'Full Access: You have complete control over settings, users, and all projects on the instance.')
                            : (lang === 'fr'
                                ? 'Accès Restreint : Vous pouvez consulter les logs des projets auxquels vous avez été explicitement assigné.'
                                : 'Restricted Access: You can view logs for projects you have been explicitly assigned to.')
                        }
                    </p>
                </div>
              </div>

              {/* Individual Permissions List */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-4">{lang === 'fr' ? 'Détail des Permissions' : 'Detailed Permissions'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PERMISSIONS.map(p => {
                        const granted = hasPermission(p.key);
                        return (
                            <div key={p.key} className="p-3.5 rounded-xl border border-border/50 bg-muted/10 flex items-start gap-3 group hover:border-border transition-colors">
                                <div className={`p-1.5 rounded-lg shrink-0 ${granted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/5 text-muted-foreground'}`}>
                                    {granted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                </div>
                                <div className="space-y-1">
                                    <p className={`text-xs font-bold ${granted ? 'text-foreground' : 'text-muted-foreground'}`}>{lang === 'fr' ? p.label_fr : p.label}</p>
                                    <p className="text-[10px] text-muted-foreground leading-tight">{lang === 'fr' ? p.description_fr : p.description}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

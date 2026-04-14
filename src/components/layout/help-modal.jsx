import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { useLanguage } from '../../lib/LanguageContext';
import { HelpCircle, Book, Shield, Zap, Bell, Search, Code, Monitor, Globe, Container } from 'lucide-react';

const helpData = {
  en: [
    {
      title: 'Getting Started',
      icon: Zap,
      content: 'LogForge is a high-performance centralized log management platform. To start, create a Project and a Channel. Use the API Key provided in the project settings to integrate our SDK into your application.'
    },
    {
      title: 'Projects & Channels',
      icon: Book,
      content: 'Projects represent your applications. Channels are logical subdivisions (e.g. "auth", "payment"). Each project has a unique API key. Use channels to segment logs within a single application.'
    },
    {
      title: 'Log Explorer & Groups',
      icon: Search,
      content: 'Logs are automatically grouped by signature (message + level) in the "Log Groups" view to reduce noise. Use the explorer for real-time full-text search and filtering across all levels (Debug to Critical).'
    },
    {
      title: 'Alert Rules',
      icon: Bell,
      content: 'Configure Alert Rules in Settings to receive email notifications (SMTP) when specific events occur. You can set thresholds and severity filters to stay informed without being overwhelmed.'
    },
    {
      title: 'RBAC & OAuth Security',
      icon: Shield,
      content: 'Admins have full access. Members are isolated to assigned projects. OAuth and API keys ensure secure access. Users receive automated email notifications via SMTP whenever their project access or administrative permissions are modified.'
    },
    {
      title: 'Multimodal SDKs',
      icon: Code,
      content: 'LogForge supports JavaScript (Browser), Node.js, and React Native. SDKs handle automatic log batching, system/hardware metadata capture, and crash capturing locally.'
    },
    {
      title: 'Session Replay',
      icon: Zap,
      content: 'Enable "enableReplay: true" in the JS SDK constructor to record user actions leading up to errors. You can replay these sessions directly from any log detail page.'
    },
    {
      title: 'Enriched Metadata',
      icon: Monitor,
      content: 'Every log now includes deep context: User ID, Client IP, OS, CPU cores, and RAM. This data is displayed in a structured layout for instant diagnostic insights.'
    },
    {
      title: 'GELF Protocol',
      icon: Globe,
      content: 'LogForge supports the Graylog Extended Log Format (GELF). You can send logs via HTTP POST to /api/logs/gelf or via UDP to port 12201. Include your API key in the X-API-Key header (HTTP) or the _api_key field (UDP).'
    },
    {
      title: 'Docker Infrastructure',
      icon: Container,
      content: 'Monitor all your Docker containers globally with LogForge Agent. No code changes are required; the agent collects logs via the Docker socket and forwards them to the centralized Docker Logs view.'
    }
  ],
  fr: [
    {
      title: 'Premiers Pas',
      icon: Zap,
      content: 'LogForge est une plateforme de gestion des logs haute performance. Pour commencer, créez un Projet et un Canal. Utilisez la clé API fournie dans les paramètres du projet pour intégrer notre SDK.'
    },
    {
      title: 'Projets & Canaux',
      icon: Book,
      content: 'Les projets représentent vos applications. Les canaux sont des subdivisions logiques (ex: "auth", "paiement"). Utilisez les canaux pour segmenter les logs au sein d\'une même application.'
    },
    {
      title: 'Explorateur & Groupes',
      icon: Search,
      content: 'Les logs sont automatiquement regroupés par signature (message + niveau) dans la vue "Groupements d\'erreurs". Utilisez l\'explorateur pour la recherche full-text en temps réel (du Debug au Critique).'
    },
    {
      title: 'Règles d\'Alerte',
      icon: Bell,
      content: 'Configurez des règles d\'alerte pour recevoir des notifications email (SMTP). Vous pouvez définir des seuils et des filtres de sévérité pour rester informé sans être submergé.'
    },
    {
      title: 'RBAC & Sécurité OAuth',
      icon: Shield,
      content: 'Les admins ont un accès complet. Les membres sont isolés aux projets assignés. L\'OAuth et les clés API garantissent la sécurité. Les utilisateurs reçoivent des notifications email automatiques via SMTP dès que leurs accès projets ou permissions administratives sont modifiés.'
    },
    {
      title: 'SDK Multimodaux',
      icon: Code,
      content: 'LogForge supporte JavaScript (Browser), Node.js et React Native. Les SDK gèrent le batching, la capture automatique des métadonnées système/matérielles et des crashs.'
    },
    {
      title: 'Session Replay',
      icon: Zap,
      content: 'Activez "enableReplay: true" dans le constructeur du SDK JS pour enregistrer les actions utilisateur. Vous pouvez rejouer ces sessions depuis les détails d\'un log.'
    },
    {
      title: 'Métadonnées Enrichies',
      icon: Monitor,
      content: 'Chaque log inclut désormais un contexte complet : ID utilisateur, IP, OS, cœurs CPU et RAM, affichés de manière structurée pour un diagnostic instantané.'
    },
    {
      title: 'Protocole GELF',
      icon: Globe,
      content: 'LogForge supporte le format GELF. Vous pouvez envoyer des logs via HTTP POST sur /api/logs/gelf ou via UDP sur le port 12201. Incluez votre clé API dans l\'en-tête X-API-Key (HTTP) ou le champ _api_key (UDP).'
    },
    {
      title: 'Infrastructure Docker',
      icon: Container,
      content: 'Supervisez l\'ensemble de vos conteneurs Docker avec l\'Agent LogForge. Aucune modification de code n\'est requise ; l\'agent collecte les logs via la socket Docker et les transmet à la vue centralisée des Logs Docker.'
    }
  ]
};

export const HelpModal = ({ open, onOpenChange }) => {
  const { lang, t, appSettings } = useLanguage();
  const data = helpData[lang] || helpData.en;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-500" />
            {t('help')} / {t('faq')}
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            {lang === 'fr' ? `Guide complet d'utilisation de la plateforme ${appSettings?.app_name || 'LogForge'}` : `Complete ${appSettings?.app_name || 'LogForge'} platform usage guide`}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 mt-6 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(helpData[lang] || helpData.en || []).map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="faq-item-card space-y-3 p-4 rounded-xl border border-zinc-900 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{item.title}</h4>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                    {String(item.content).replace(/LogForge/g, appSettings?.app_name || 'LogForge')}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <h4 className="text-sm font-bold text-white mb-2">{lang === 'fr' ? 'Besoin d\'aide supplémentaire ?' : 'Need more help?'}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              {lang === 'fr'
                ? 'Si vous ne trouvez pas la réponse à votre question, n\'hésitez pas à contacter l\'administrateur de votre instance ou à consulter la documentation technique complète.'
                : 'If you can\'t find the answer to your question, feel free to contact your instance administrator or consult the full technical documentation.'}
            </p>
            <div className="text-[10px] font-mono text-emerald-500">
              {appSettings?.app_name || 'LogForge'} v0.1.8 • {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

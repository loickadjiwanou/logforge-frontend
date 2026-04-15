import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../lib/LanguageContext';

const changelogData = [
  {
    version: '0.2.0',
    date: '2026-04-15',
    changes: {
      en: [
        'Desktop App (Electron): LogForge is now available as a native desktop application for macOS (DMG, universal x64 + arm64), Windows (NSIS installer), and Linux (AppImage). The entire frontend is embedded inside the bundle — no browser required.',
        'Backend URL Configuration: A server icon button on the login screen (Electron only) opens a configuration modal to set the backend URL. Includes a live connection test (ping /api/health) and persists the URL across restarts.',
        'Dynamic Backend URL: All API calls and WebSocket connections now resolve the backend URL at runtime from localStorage, allowing reconfiguration without rebuilding the app.',
        'HashRouter in Electron: The app automatically switches to HashRouter when running inside Electron so that file:// protocol navigation works correctly.',
        'JS SDK v0.2.0: Fixed 4xx infinite retry loop — client errors (400–499) no longer re-queue logs. Added getVersion() method. Fixed deprecated navigator.platform usage.',
        'Python SDK v0.2.0: Added raise_for_status() on the httpx code path so HTTP errors are properly surfaced instead of silently ignored.',
        'Docker Agent v0.2.0: Added fatal auth detection (401/403 stops the sender loop). Added exponential backoff on retries. Fixed queue.Full blocking with put_nowait(). Added MAX_RETRIES env variable.',
        'OpenAPI fix: Corrected invitation token validation URL from /api/invite/validate/{token} to /api/auth/invite/validate/{token}. Added all 4 /api/invitations/ endpoints (list, create, delete, resend) with full schemas.',
        'Bundle Splitting (landing page): Vendor chunks now split into react, ui (framer-motion + lucide), and syntax-highlighter — main bundle reduced from 1.15 MB to 316 KB (−73%).',
        'SEO (landing page): Added Open Graph, Twitter Card meta tags, robots.txt, and non-blocking Google Fonts loading.',
      ],
      fr: [
        'Application Desktop (Electron) : LogForge est désormais disponible en application native pour macOS (DMG universel x64 + arm64), Windows (installeur NSIS) et Linux (AppImage). Le frontend est entièrement embarqué dans le bundle, aucun navigateur requis.',
        'Configuration de l\'URL Backend : Un bouton icône serveur sur l\'écran de connexion (Electron uniquement) ouvre un modal de configuration pour saisir l\'URL du backend, avec test de connexion en direct et persistance entre les redémarrages.',
        'URL Backend Dynamique : Tous les appels API et connexions WebSocket résolvent désormais l\'URL backend depuis localStorage à l\'exécution, permettant la reconfiguration sans rebuild.',
        'HashRouter dans Electron : L\'app bascule automatiquement sur HashRouter dans Electron pour que la navigation fonctionne correctement avec le protocole file://.',
        'JS SDK v0.2.0 : Correction de la boucle infinie de réessai sur les erreurs 4xx — les erreurs client (400–499) ne remettent plus les logs en file d\'attente. Ajout de getVersion(). Correction de navigator.platform déprécié.',
        'Python SDK v0.2.0 : Ajout de raise_for_status() sur le chemin httpx pour que les erreurs HTTP soient correctement remontées au lieu d\'être ignorées silencieusement.',
        'Docker Agent v0.2.0 : Détection des erreurs d\'auth fatales (401/403 arrête la boucle d\'envoi). Ajout du backoff exponentiel. Correction du blocage queue.Full avec put_nowait(). Ajout de la variable d\'env MAX_RETRIES.',
        'Correction OpenAPI : URL de validation de token corrigée de /api/invite/validate/{token} vers /api/auth/invite/validate/{token}. Ajout des 4 endpoints /api/invitations/ (liste, création, suppression, renvoi) avec schémas complets.',
        'Découpage des Bundles (landing page) : Les chunks vendors sont désormais séparés en react, ui (framer-motion + lucide) et syntax-highlighter — bundle principal réduit de 1,15 Mo à 316 Ko (−73%).',
        'SEO (landing page) : Ajout des balises Open Graph, Twitter Card, robots.txt et chargement Google Fonts non bloquant.',
      ]
    }
  },
  {
    version: '0.1.9',
    date: '2026-04-14',
    changes: {
      en: [
        'Multi-Company Support: The same email address can now belong to multiple independent workspaces. Each account is fully isolated with its own password, role, and permissions per company.',
        'New 3-Step Login Flow: Login is now split into email lookup → workspace selection → password entry, so users with multiple workspaces can choose the right one before authenticating.',
        'Email Lookup Endpoint: New /auth/email-lookup endpoint resolves which workspaces are associated with an email address without requiring a password.',
        'Compound Unique Index: Replaced the global unique email index with a per-company (email, company_id) compound index enabling true multi-company membership.',
        'OAuth Multi-Company Guard: GitHub and GitLab OAuth now detect when an email belongs to multiple workspaces and redirect the user to the email/password 3-step flow.',
        'Docker Logs Permission UX: Members without the view_docker_logs permission now see a clear "Restricted Access" screen instead of being silently disconnected.',
        'Sidebar Navigation Guard: Clicking Docker Logs in the sidebar without permission shows an inline explanation dialog instead of navigating to a forbidden page.',
        'Session Stability Fix: 403 Forbidden responses no longer trigger automatic logout — only 401 Unauthorized does.',
        'Channel Creation UX: Attempting to create a channel when no projects exist now shows an actionable toast message instead of a blocked button.',
        'Invitation Expiry: Invitation links now expire after 24 hours (previously 7 days).',
        'Forgot Password Dialog: The login page now shows a clear 3-step guide explaining the admin-triggered password reset flow.',
        'ES Aggregation Fix: Corrected grouped log hash extraction from Elasticsearch buckets (b[\'key\'] instead of b[\'key\'][\'group\']).',
        'Alert Email Fix: Removed duplicate HTML part in alert notification emails that caused double-body rendering.',
      ],
      fr: [
        'Support Multi-Compagnie : Le même email peut désormais appartenir à plusieurs espaces de travail indépendants, chacun avec son propre mot de passe, rôle et permissions.',
        'Nouveau Flux de Connexion en 3 Étapes : La connexion est désormais divisée en recherche d\'email → sélection du workspace → saisie du mot de passe.',
        'Endpoint Email Lookup : Nouvel endpoint /auth/email-lookup qui identifie les workspaces associés à un email sans exiger de mot de passe.',
        'Index Unique Composé : Remplacement de l\'index unique global sur l\'email par un index composé (email, company_id) permettant la vraie multi-appartenance.',
        'Protection OAuth Multi-Compagnie : GitHub et GitLab OAuth détectent désormais si un email appartient à plusieurs workspaces et redirigent vers le flux 3 étapes.',
        'UX Logs Docker : Les membres sans permission view_docker_logs voient un écran "Accès restreint" clair au lieu d\'être déconnectés silencieusement.',
        'Garde de Navigation Sidebar : Cliquer sur Logs Docker sans permission affiche un dialog explicatif au lieu de naviguer vers une page interdite.',
        'Stabilité de Session : Les réponses 403 Forbidden ne déclenchent plus de déconnexion automatique — seul le 401 Unauthorized le fait.',
        'UX Création de Canal : Tenter de créer un canal sans projet affiche un message toast actionnable au lieu d\'un bouton bloqué.',
        'Expiration des Invitations : Les liens d\'invitation expirent désormais après 24 heures (auparavant 7 jours).',
        'Dialog Mot de Passe Oublié : La page de connexion affiche désormais un guide en 3 étapes expliquant le flux de réinitialisation déclenché par l\'administrateur.',
        'Correction Agrégation ES : Extraction correcte du hash des groupes depuis les buckets Elasticsearch (b[\'key\'] au lieu de b[\'key\'][\'group\']).',
        'Correction Email d\'Alerte : Suppression du corps HTML en double dans les emails d\'alerte qui causait un rendu dupliqué.',
      ]
    }
  },
  {
    version: '0.1.8',
    date: '2026-04-13',
    changes: {
      en: [
        'Official JavaScript SDK (@loickadj/logforge-js): Published on npm. Full-featured browser + Node.js 18+ client with batching, auto-flush, retry with exponential backoff, autocapture of uncaught errors, session replay support, and TypeScript declarations.',
        'Official Python SDK (logforge-py): Published on PyPI. Thread-safe client for Python 3.8+ with background flush thread, batch ingestion, capture_exception() with full traceback, and support for both requests and httpx HTTP backends.',
        'SDK Installation: Install via npm (npm install @loickadj/logforge-js) or pip (pip install logforge-py[requests]). No copy-paste required.',
        'TypeScript Support: The JavaScript SDK ships with full .d.ts type declarations for first-class IDE autocompletion.',
        'SDK shutdown() / flush(): Both SDKs expose explicit flush() and shutdown() methods to guarantee log delivery before process exit.',
        'User Context API: setUser() / clearUser() methods available in both SDKs to attach persistent user metadata to all subsequent logs.',
        'Improved In-App SDK Docs: The SDK Documentation page now prominently displays npm and pip installation commands alongside the existing code samples.'
      ],
      fr: [
        'SDK JavaScript Officiel (@loickadj/logforge-js) : Publié sur npm. Client complet pour navigateur + Node.js 18+ avec traitement par lots, auto-flush, réessais avec backoff exponentiel, capture automatique des erreurs non gérées, support Session Replay et déclarations TypeScript.',
        'SDK Python Officiel (logforge-py) : Publié sur PyPI. Client thread-safe pour Python 3.8+ avec thread de flush en arrière-plan, ingestion par lots, capture_exception() avec traceback complet, et support de requests et httpx.',
        'Installation des SDKs : Installation via npm (npm install @loickadj/logforge-js) ou pip (pip install logforge-py[requests]). Plus besoin de copier-coller le code.',
        'Support TypeScript : Le SDK JavaScript embarque des déclarations .d.ts complètes pour l\'autocomplétion IDE de premier ordre.',
        'Méthodes shutdown() / flush() : Les deux SDKs exposent des méthodes flush() et shutdown() explicites pour garantir la livraison des logs avant la fin du processus.',
        'API Contexte Utilisateur : Méthodes setUser() / clearUser() disponibles dans les deux SDKs pour attacher des métadonnées utilisateur persistantes à tous les logs suivants.',
        'Documentation SDK In-App améliorée : La page Documentation SDK affiche désormais en évidence les commandes d\'installation npm et pip aux côtés des exemples de code existants.'
      ]
    }
  },
  {
    version: '0.1.7',
    date: '2026-04-07',
    changes: {
      en: [
        'Unified User Management: Redesigned the management table into a single, high-performance layout with dedicated modal controls.',
        'Permissions Modal System: Implemented a premium, theme-adaptive modal for granular platform permission management with real-time state synchronization.',
        'Password Recovery Workflow: Introduced an official "Contact Administrator" flow for members and a dedicated CLI recovery script for system administrators.',
        'Refined UI Spacing & Alignment: Precision-tuned the layout of the settings module, including optimized column balancing and glassmorphism effects.',
        'Platform Stability: Resolved critical runtime errors in the login and settings page lifecycle ensuring a more robust user experience.',
        'Full Light Mode Support: Optimized all user management components (tables, modals, switches) for perfect visibility in the light theme.'
      ],
      fr: [
        'Gestion Unifiée des Utilisateurs : Redesign complet du tableau d\'administration en un layout unique haute performance avec contrôles par modal.',
        'Nouveau Système de Permissions : Implémentation d\'un modal premium adaptatif pour la gestion granulaire des droits avec synchronisation temps-réel.',
        'Flux de Récupération de Mot de Passe : Introduction d\'un flux "Contact Administrateur" pour les membres et d\'un script CLI dédié pour les administrateurs.',
        'Affinage du Design : Optimisation de l\'espacement, de l\'alignement des colonnes et ajout d\'effets de translucidité (glassmorphism) dans les paramètres.',
        'Stabilité de la Plateforme : Résolution d\'erreurs de runtime critiques sur les pages de connexion et de paramètres.',
        'Support Mode Clair Intégral : Optimisation de tous les composants de gestion (tableaux, modals, interrupteurs) pour une visibilité parfaite en mode clair.'
      ]
    }
  },
  {
    version: '0.1.6',
    date: '2026-04-05',
    changes: {
      en: [
        'Material Design Stabilization: Fixed a regression where Advanced Visual Mode would deactivate during settings updates.',
        'Real-Time Feed Overhaul: Completely redesigned the dashboard feed with a console-inspired grid layout and fixed-width timestamp columns for perfect readability.',
        'Theme Parity & Stabilization: Achieved 100% visual parity between Material dark mode and the default theme using a new semantic variable system.',
        'Global UI Rounding: Standardized all inputs, selects, and buttons with refined "pill-shaped" or high-radius borders for a modern, organic aesthetic.',
        'Search & Filter Polish: Improved spacing in all search bars and dropdown controls to prevent text and icon overlaps.',
        'Dynamic Primary Color: Hover effects and Material components now correctly sync with the application\'s active primary color across all pages.'
      ],
      fr: [
        'Stabilisation du Mode Material : Correction d\'une régression qui désactivait le "Advanced Visual Mode" lors de l\'enregistrement des paramètres.',
        'Refonte du Flux Temps-Réel : Redesign complet du flux dashboard avec un layout grille de style console et des colonnes d\'horodatage à largeur fixe.',
        'Parité des Thèmes : Atteinte d\'une parité visuelle totale entre le mode sombre Material et le thème par défaut via un nouveau système de variables sémantiques.',
        'Harmonisation des Arrondis : Standardisation de tous les inputs, sélecteurs et boutons avec des bords "pill-design" pour une esthétique moderne et fluide.',
        'Affinage de l\'Interface : Amélioration de l\'espacement dans les barres de recherche et les contrôles pour éviter tout chevauchement d\'icônes.',
        'Couleurs Dynamiques : Les effets de survol et les composants Material se synchronisent désormais parfaitement avec la couleur primaire choisie.'
      ]
    }
  },
  {
    version: '0.1.5',
    date: '2026-04-03',
    changes: {
      en: [
        'Enriched Administrative Notifications: Emails for permission changes, role updates, and project access now feature professional, explicit HTML templates with performer attribution.',
        'Global Notification Preferences: Administrators now have granular control over which system events trigger email notifications directly from the UI.',
        'Notification Lifecycle Tracking: Log detail pages now feature a permanent visual "Alert Email Triggered" indicator allowing administrators to easily verify if an email was sent for a specific log.',
        'Actionable Alerts: All system emails now include direct call-to-action (CTA) buttons to quickly access the relevant logs or dashboard.',
        'Enhanced Developer Documentation: The in-app SDK docs for the Docker Agent were completely overhauled with specific source-build requirements, dynamic host mapping instructions, and alert rule testing sequences.',
        'Dynamic Shell Snippets: UI-generated Docker code snippets auto-adapt to your active environment (localhost vs. production domains).',
        'Refined Light/Dark Mode UI: Fixed visibility issues with UI components (like the notification settings) under the light theme.',
        'Structural UI Fixes: Resolved deep JSX nesting bugs in the settings layout and restored functionality to the Alert Rules pagination.'
      ],
      fr: [
        'Notifications Administratives Enrichies : Les e-mails de changements de permissions, mises à jour de rôles et accès aux projets disposent de modèles HTML professionnels avec attribution explicite des actions.',
        'Préférences Globales de Notification : Les administrateurs peuvent désormais activer/désactiver de façon ciblée les notifications des événements administratifs depuis l\'interface.',
        'Suivi du Cycle des Notifications : Les pages de détails des journaux disposent désormais d\'un traqueur visuel permanent "Alerte E-mail" permettant de vérifier instantanément si un e-mail a été expédié.',
        'Alertes Actionnables : Tous les e-mails système incluent des boutons directs (CTA) pour accéder immédiatement aux journaux ou au dashboard.',
        'Documentation Développeur Enrichie : La documentation intégrée de l\'Agent Docker a été entièrement repensée avec les instructions de compilation locales, explications de réseau distant et scénarios de tests intelligents.',
        'Commandes Shell Dynamiques : Les extraits de code Docker générés par l\'interface s\'adaptent automatiquement à votre hôte réseau (domaine SSL vs localhost).',
        'Mode Clair optimisé : Correction des problèmes de contraste sur plusieurs éléments de l\'interface afin de garantir une visibilité parfaite.',
        'Fix de l\'Interface des Paramètres : Résolution de bugs structurels (imbrications JSX) et restauration de la pagination des Règles d\'Alerte.'
      ]
    }
  },
  {
    version: '0.1.4',
    date: '2026-04-01',
    changes: {
      en: [
        'Infrastructure Monitoring: Complete Docker Agent for automated container log collection across the platform.',
        'Granular RBAC: Administrators can now grant specialized "View Docker Logs" permissions to team members.',
        'Persistent Auto-Refresh: Monitoring intervals (5s, 30s, etc.) are now synced with the URL and survive page navigation.',
        'Performance Optimization: High-efficiency batch ingestion with optimized alert rule checking for superior throughput.',
        'Project Management: Clickable Project UUIDs with copy buttons to simplify SDK and agent configuration.'
      ],
      fr: [
        'Monitoring d\'Infrastructure : Agent Docker complet pour la collecte automatisée des logs de conteneurs sur toute la plateforme.',
        'RBAC Granulaire : Les administrateurs peuvent désormais accorder la permission "Voir Logs Docker" aux membres de l\'équipe.',
        'Auto-Refresh Persistant : Les intervalles de rafraîchissement sont désormais synchronisés avec l\'URL et persistent entre les pages.',
        'Optimisation de Performance : Ingestion par lots haute performance avec vérification optimisée des alertes.',
        'Gestion de Projet : UUIDs de projet cliquables avec boutons de copie pour simplifier la configuration des SDKs.'
      ]
    }
  },
  {
    version: '0.1.3',
    date: '2026-03-25',
    changes: {
      en: [
        'GELF Protocol Integration: LogForge now accepts logs via standard GELF HTTP and UDP (port 12201).',
        'Enhanced Ingestion: High-performance GELF payload parsing compatible with Docker, Fluentd, and Graylog shippers.',
        'Visual Identity: Brand new sleek LogLoader component featuring a responsive, theme-adaptive sinusoidal wave for all data loading states.'
      ],
      fr: [
        'Intégration du protocole GELF : LogForge accepte désormais les logs via GELF HTTP et UDP standard (port 12201).',
        'Ingestion Améliorée : Analyse haute performance des données GELF, compatible avec Docker, Fluentd et Graylog.',
        'Identité Visuelle : Tout nouveau composant LogLoader (signal d\'onde sinusoïdale dynamique) remplaçant les anciens spinners pour tous les temps de chargement écran.'
      ]
    }
  },
  {
    version: '0.1.2',
    date: '2026-03-23',
    changes: {
      en: [
        'Secure Onboarding: New 3-step interactive setup flow for the first application administrator.',
        'Tailored Setup: Customize your application name and brand color directly during the onboarding process.',
        'Theme Selection: Choose between Dark or Light mode during setup for an immediate customized experience.',
        'Direct Auto-Login: Seamless transition from setup to dashboard without additional login steps.',
        'Language Switching: Change platform language instantly during and after the setup process.',
        'Premium Aesthetics: Refined onboarding UI with modern glassmorphism and real-time theme preview.'
      ],
      fr: [
        'Onboarding Sécurisé : Nouveau flux de configuration interactif en 3 étapes pour le premier administrateur.',
        'Configuration sur Mesure : Personnalisez le nom et la couleur de l\'application directement pendant l\'onboarding.',
        'Sélection du Thème : Choisissez entre le mode Sombre ou Clair dès la configuration.',
        'Auto-Login Direct : Transition fluide de la configuration vers le tableau de bord sans étape de connexion supplémentaire.',
        'Changement de Langue : Changez la langue de la plateforme instantanément pendant et après la configuration.',
        'Esthétique Premium : Interface d\'onboarding affinée avec design glassmorphism et prévisualisation du thème en temps réel.'
      ]
    }
  },
  {
    version: '0.1.1',
    date: '2026-03-19',
    changes: {
      en: [
        'Dynamic White-Labeling: Change application name (e.g., RightLog), logo, and primary color instantly across the entire platform.',
        'Full Internationalization (i18n): Complete French and English support with automatic language preference persistence.',
        'UI Stability: Eliminated initial "white flashes" and improved loading states during application bootstrap.'
      ],
      fr: [
        'White-Labeling Dynamique : Changez le nom (ex: RightLog), le logo et la couleur primaire de l\'application instantanément sur toute la plateforme.',
        'Internationalisation complète (i18n) : Support intégral du Français et de l\'Anglais avec persistance automatique de la langue.',
        'Stabilité UI : Élimination des "flashs blancs" initiaux et amélioration du chargement au démarrage.'
      ]
    }
  },
  {
    version: '0.1.0',
    date: '2026-03-18',
    changes: {
      en: [
        'User-Specific Dashboards: Each user can now add, remove, and customize their own set of dashboard widgets.',
        'Collapsible Sidebar: Reclaimed horizontal space with a smooth collapsible sidebar menu and icon-only mode.'
      ],
      fr: [
        'Tableaux de bord personnalisés : Chaque utilisateur peut désormais ajouter, supprimer et personnaliser ses propres widgets.',
        'Barre latérale pliable : Gain d\'espace horizontal avec un menu latéral pliable aux animations fluides.'
      ]
    }
  },
  {
    version: '0.0.9',
    date: '2026-03-10',
    changes: {
      en: [
        'Session Replay: Record and replay user actions (via rrweb) directly from log details for faster debugging.',
        'Enriched Metadata: Automatic capture of OS, hardware stats (CPU, RAM), and client IP for every log event.'
      ],
      fr: [
        'Session Replay : Enregistrez et rejouez les actions utilisateur (rrweb) directement depuis les logs pour un débogage accéléré.',
        'Métadonnées Enrichies : Capture automatique de l\'OS, des stats matérielles (CPU, RAM) et de l\'IP client pour chaque événement.'
      ]
    }
  },
  {
    version: '0.0.8',
    date: '2026-03-07',
    changes: {
      en: [
        'Email Notifications & SMTP: Configure alert rules to stay informed via email when critical events occur.',
        'RBAC (Role-Based Access Control): Granular permissions for Admins and Members to secure instance management.'
      ],
      fr: [
        'Notifications Email & SMTP : Configurez des alertes pour être informé par email lors d\'événements critiques.',
        'RBAC (Contrôle d\'Accès) : Permissions granulaires pour les Administrateurs et les Membres pour sécuriser la gestion de l\'instance.'
      ]
    }
  },
  {
    version: '0.0.7',
    date: '2026-03-10',
    changes: {
      en: [
        'Session Replay: Record user actions (via rrweb) when an error occurs and replay the session directly from the log details view.',
        'Enriched Metadata: Automatic capture of OS, hardware stats (CPU, RAM), and client IP for every log event.',
        'Expanded SDK Support: Official documentation and snippets added for Node.js and React Native integration.',
        'Refined Log Details: Structured layout for device/user info with icons and responsive spanning.',
        'REST API Enhancements: Added new endpoints for session replay ingestion and retrieval.',
        'Advanced Recording Options: Added "enableReplay" to the JS SDK for optional session tracking.',
      ],
      fr: [
        'Session Replay : Enregistrez les actions utilisateur (via rrweb) lorsqu\'une erreur survient et rejouez la session directement depuis les détails du log.',
        'Métadonnées Enrichies : Capture automatique de l\'OS, des stats matérielles (CPU, RAM) et de l\'IP client pour chaque événement.',
        'Support SDK Étendu : Documentation officielle et snippets ajoutés pour l\'intégration Node.js et React Native.',
        'Détails de Logs Affinés : Mise en page structurée pour les infos device/user avec icônes et affichage adaptatif.',
        'Améliorations de l\'API REST : Ajout de nouveaux points de terminaison pour l\'ingestion et la récupération des sessions.',
        'Options d\'Enregistrement Avancées : Ajout de "enableReplay" au SDK JS pour un suivi optionnel des sessions.',
      ]
    }
  },
  {
    version: '0.0.6',
    date: '2026-03-07',
    changes: {
      en: [
        'Automated Access Notifications: Users now receive instant email notifications via SMTP when an administrator grants or revokes project access or administrative permissions.',
        'Centralized Email Utility: Improved SMTP infrastructure with professional HTML templates.',
        'Enhanced Security Notifications: Real-time alerts for changes in RBAC permissions (SMTP, Alert Rules, Delete Projects).',
        'Updated Documentation: Full documentation update and FAQ improvements.'
      ],
      fr: [
        'Notifications d\'Accès Automatisées : Les utilisateurs reçoivent désormais des notifications email instantanées (SMTP) lorsqu\'un administrateur accorde ou révoque un accès projet ou des permissions administratives.',
        'Utilitaire d\'Email Centralisé : Infrastructure SMTP améliorée avec des modèles HTML professionnels.',
        'Alertes Sécurité Renforcées : Notifications en temps réel pour les changements de permissions RBAC (SMTP, Alertes, Suppression de Projets).',
        'Documentation à Jour : Mise à jour complète de la documentation et amélioration de la FAQ.'
      ]
    }
  },
  {
    version: '0.0.5',
    date: '2026-03-07',
    changes: {
      en: [
        'Integrated GitHub & GitLab OAuth: Log in securely using your preferred identity provider.',
        'OAuth Callback Handling: Dedicated secure callback route for seamless redirection.',
        'Token-Based Session Persistence: Improved session management for third-party auth.',
        'Updated Login/Signup Branding: Dynamic application name in auth page footers.'
      ],
      fr: [
        'Intégration OAuth GitHub & GitLab : Connectez-vous via vos comptes sociaux préférés.',
        'Gestion des callbacks OAuth : Route de redirection sécurisée et fluide.',
        'Sessions via Token : Gestion améliorée de la persistance des sessions OAuth.',
        'Branding d\'Authentification : Nom d\'application dynamique dans le pied de page des pages Login/Signup.'
      ]
    }
  },
  {
    version: '0.0.4',
    date: '2026-03-07',
    changes: {
      en: [
        'Unified Log Grouping: Automatic grouping for all log levels (Debug to Critical).',
        'Server-Side Pagination: High-performance data retrieval for groups and logs.',
        'Modal Pagination: Added internal pagination (50 items/page) for error occurrences.',
        'Dashboard Refinement: Distinct metrics cards for Critical, Error, and Warning levels.',
        'Performance Stress Tested: Confirmed 100k+ logs ingestion capacity.',
        'Refined RBAC: Enhanced project isolation and Member role restrictions.',
        'Fixed UI layout for Real-Time Feed and Footer components.'
      ],
      fr: [
        'Groupement de logs unifié : Regroupement automatique pour tous les niveaux.',
        'Pagination côté serveur : Récupération haute performance pour les groupes et logs.',
        'Pagination en modal : Ajout de pagination interne (50 items/page) pour les occurrences.',
        'Affinement du Dashboard : Cartes de métriques distinctes (Critique, Erreur, Avertissement).',
        'Tests de performance : Capacité d\'ingestion confirmée de 100k+ logs.',
        'RBAC affiné : Isolation des projets et restrictions du rôle Membre améliorées.',
        'Correction du layout pour le flux en temps réel et le pied de page.'
      ]
    }
  },
  {
    version: '0.0.3',
    date: '2026-03-06',
    changes: {
      en: [
        'Added global language support (English & French).',
        'Implemented Role-Based Access Control (RBAC) with granular permissions.',
        'Added project-level access security for members.',
        'Global pagination (99 items per page) across all views.',
        'Added Python SDK documentation and examples.',
        'Dynamic App Customization (Logo, Name, Primary Color).',
        'Professional HTML email templates for alerts.',
        'Auto-save SMTP configuration on successful test.'
      ],
      fr: [
        'Ajout du support linguistique global (Anglais & Français).',
        'Mise en œuvre du contrôle d\'accès basé sur les rôles (RBAC) avec des permissions granulaires.',
        'Ajout de la sécurité d\'accès au niveau du projet pour les membres.',
        'Pagination globale (99 éléments par page) sur toutes les vues.',
        'Ajout de la documentation et des exemples du SDK Python.',
        'Personnalisation dynamique de l\'application (Logo, Nom, Couleur primaire).',
        'Modèles d\'e-mails HTML professionnels pour les alertes.',
        'Enregistrement automatique de la configuration SMTP après un test réussi.'
      ]
    }
  },
  {
    version: '0.0.2',
    date: '2026-02-25',
    changes: {
      en: [
        'Infrastructure isolation by project.',
        'Real-time log streaming via WebSockets.',
        'Improved log explorer searching and filtering.'
      ],
      fr: [
        'Isolation de l\'infrastructure par projet.',
        'Flux de logs en temps réel via WebSockets.',
        'Amélioration de la recherche et du filtrage de l\'explorateur de logs.'
      ]
    }
  },
  {
    version: '0.0.1',
    date: '2026-02-10',
    changes: {
      en: [
        'Initial release of LogForge.',
        'Support for multiple projects and channels.',
        'Elasticsearch-backed log storage.'
      ],
      fr: [
        'Version initiale de LogForge.',
        'Prise en charge de plusieurs projets et canaux.',
        'Stockage des logs via Elasticsearch.'
      ]
    }
  }
];

export const ChangelogModal = ({ open, onOpenChange }) => {
  const { lang, t, appSettings } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {t('changelog')}
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">v0.2.0</Badge>
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            {lang === 'fr' ? 'Historique des versions et changements récents' : 'Version history and recent changes'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 mt-4">
          <div className="space-y-8">
            {changelogData.map((release) => (
              <div key={release.version} className="relative pl-6 border-l border-zinc-800">
                <div className="absolute w-2.5 h-2.5 bg-emerald-500 rounded-full -left-[5.5px] top-1.5 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white font-mono">v{release.version}</h4>
                  <span className="text-[10px] text-zinc-500">{release.date}</span>
                </div>
                <ul className="space-y-2 list-disc list-inside">
                  {(release.changes[lang] || release.changes['en'] || []).map((change, idx) => (
                    <li key={idx} className="text-zinc-400 text-sm leading-relaxed">
                      {String(change).replace(/LogForge/g, appSettings?.app_name || 'LogForge')}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

import { LogLoader } from './log-loader';
import { useLanguage } from '../../lib/LanguageContext';

export function PageLoader() {
  const { lang } = useLanguage();
  
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LogLoader text={lang === 'fr' ? 'Chargement' : 'Loading'} />
    </div>
  );
}

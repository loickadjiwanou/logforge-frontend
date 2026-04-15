import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Rocket, ShieldCheck, UserPlus, ChevronRight, ChevronLeft, Loader2, Lock, Mail, User, Languages, Palette, Layout, Moon, Sun, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const PRESET_COLORS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Indigo', value: '#6366f1' },
];

const SetupPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company_name: '',
    app_name: 'LogForge',
    primary_color: '#10b981',
    theme: 'dark'
  });
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { checkSetupStatus, loginWithToken } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  // Setup page is always accessible — no redirect needed

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleColorSelect = (color) => {
    setFormData({ ...formData, primary_color: color });
  };

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'fr' : 'en';
    setLang(newLang);
    localStorage.setItem('logforge_lang', newLang);
  };

  const toggleTheme = () => {
    setFormData({ ...formData, theme: formData.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleNext = () => {
    if (step === 2) {
      if (!formData.company_name.trim()) {
        toast.error(lang === 'fr' ? 'Le nom de la compagnie est requis.' : 'Company name is required.');
        return;
      }
      if (!formData.app_name.trim()) {
        toast.error(lang === 'fr' ? "Le nom de l'application est requis." : 'App name is required.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptPrivacy || !acceptTerms) {
      toast.error(t('mustAcceptTerms'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    if (formData.password.length < 8) {
      toast.error(t('passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/setup/admin', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company_name: formData.company_name,
        app_name: formData.app_name,
        primary_color: formData.primary_color,
        theme: formData.theme
      });
      
      const { access_token, user: userData } = res.data;
      
      toast.success(t('setupSuccess'));
      
      // Auto-login
      loginWithToken(access_token, userData);
      
      // Update setup status globally
      await checkSetupStatus();
      
      // Direct navigation to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Setup error:', error);
      toast.error(error.response?.data?.detail || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const isDark = formData.theme === 'dark';

  return (
    <div className={`min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans transition-colors duration-500 ${isDark ? 'bg-[#09090b] text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Background Decorative Elements */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse transition-all duration-1000" 
        style={{ backgroundColor: `${formData.primary_color}${isDark ? '20' : '15'}` }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse transition-all duration-1000" 
        style={{ backgroundColor: `${formData.primary_color}${isDark ? '10' : '05'}` }}
      />
      
      {/* Controls (Top Right) */}
      <div className="absolute top-8 right-8 z-20 flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleTheme}
          className={`rounded-full border transition-all ${isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleLanguage}
          className={`border transition-all rounded-full px-4 py-2 flex items-center gap-2 ${isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
        >
          <Languages className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase">{lang}</span>
        </Button>
      </div>

      <div className="w-full max-w-xl px-4 z-10 py-12">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500"
                style={{ backgroundColor: formData.primary_color, boxShadow: `0 10px 15px -3px ${formData.primary_color}40` }}
            >
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className={`text-2xl font-bold tracking-tight transition-colors duration-500 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              {formData.app_name}
            </span>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s ? 'w-8' : `w-2 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`
              }`} 
              style={{ backgroundColor: step === s ? formData.primary_color : undefined }}
            />
          ))}
        </div>

        <div className="transition-all duration-500 transform">
          {step === 1 && (
            <Card className={`border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <CardHeader className="text-center pb-2">
                <CardTitle className={`text-3xl font-bold mb-2 tracking-tight transition-colors ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    {t('setupTitle').replace('{appName}', 'LogForge')}
                </CardTitle>
                <CardDescription className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>
                  {t('setupDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className={`flex items-start space-x-4 p-4 rounded-2xl border transition-colors group ${isDark ? 'bg-zinc-800/30 border-zinc-700/30 hover:border-zinc-500/30' : 'bg-zinc-50 border-zinc-100 hover:border-zinc-200'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-white border-zinc-100'}`}>
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className={`font-medium transition-colors ${isDark ? 'text-white' : 'text-zinc-900'}`}>{t('secureByDesign')}</h4>
                      <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{t('secureByDesignDesc')}</p>
                    </div>
                  </div>
                  <div className={`flex items-start space-x-4 p-4 rounded-2xl border transition-colors group ${isDark ? 'bg-zinc-800/30 border-zinc-700/30 hover:border-zinc-500/30' : 'bg-zinc-50 border-zinc-100 hover:border-zinc-200'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-white border-zinc-100'}`}>
                      <Rocket className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className={`font-medium transition-colors ${isDark ? 'text-white' : 'text-zinc-900'}`}>{t('realTimePerformance')}</h4>
                      <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{t('realTimePerformanceDesc')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Button 
                  onClick={handleNext} 
                  variant={isDark ? 'default' : 'outline'}
                  className={`w-full h-12 text-lg font-semibold rounded-xl flex items-center justify-center group ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800 border-none'}`}
                >
                  {t('startConfiguration')}
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && (
            <Card className={`border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500 transition-colors ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-2xl font-bold flex items-center tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  <Palette className="mr-2 w-6 h-6" style={{ color: formData.primary_color }} />
                  {t('appCustomizationTitle')}
                </CardTitle>
                <CardDescription className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>
                  {t('appCustomizationDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className={`${isDark ? 'text-zinc-300' : 'text-zinc-700'} ml-1`}>{t('companyName')}</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <Input
                      id="company_name"
                      name="company_name"
                      type="text"
                      placeholder={t('companyNamePlaceholder')}
                      required
                      value={formData.company_name}
                      onChange={handleChange}
                      className={`pl-10 h-11 focus:ring-zinc-500/20 rounded-xl transition-colors ${isDark ? 'bg-zinc-800/50 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{t('companyNameHelp')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="app_name" className={`${isDark ? 'text-zinc-300' : 'text-zinc-700'} ml-1`}>{t('appName')}</Label>
                  <div className="relative">
                    <Layout className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <Input
                      id="app_name"
                      name="app_name"
                      type="text"
                      placeholder={t('appNamePlaceholder')}
                      required
                      value={formData.app_name}
                      onChange={handleChange}
                      className={`pl-10 h-11 focus:ring-zinc-500/20 rounded-xl transition-colors ${isDark ? 'bg-zinc-800/50 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className={`${isDark ? 'text-zinc-300' : 'text-zinc-700'} ml-1`}>{t('primaryColor')}</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleColorSelect(color.value)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all transform hover:scale-110 ${
                          formData.primary_color === color.value ? (isDark ? 'border-white' : 'border-zinc-900') : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className={`flex items-center gap-3 mt-4 p-3 rounded-xl border transition-colors ${isDark ? 'bg-zinc-800/30 border-zinc-700/50' : 'bg-zinc-50 border-zinc-100'}`}>
                    <div className="w-8 h-8 rounded-full border border-zinc-300" style={{ backgroundColor: formData.primary_color }} />
                    <Input 
                        type="text" 
                        value={formData.primary_color}
                        onChange={(e) => handleColorSelect(e.target.value)}
                        className={`h-8 text-xs font-mono transition-colors ${isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{t('primaryColorDesc')}</p>
                </div>
              </CardContent>
              <CardFooter className="pt-4 flex gap-3">
                <Button 
                    variant="outline" 
                    onClick={handleBack}
                    className={`flex-1 h-11 transition-colors ${isDark ? 'border-zinc-800 bg-transparent text-white hover:bg-zinc-800' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'}`}
                >
                    <ChevronLeft className="mr-2 w-4 h-4" />
                    {t('back')}
                </Button>
                <Button 
                  onClick={handleNext} 
                  className="flex-[2] h-11 text-white hover:opacity-90 font-semibold rounded-xl flex items-center justify-center transition-all shadow-lg"
                  style={{ backgroundColor: formData.primary_color, boxShadow: `0 10px 15px -3px ${formData.primary_color}40` }}
                >
                  {t('next')}
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 3 && (
            <Card className={`border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500 transition-colors ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-2xl font-bold flex items-center tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  <UserPlus className="mr-2 w-6 h-6" style={{ color: formData.primary_color }} />
                  {t('adminAccountSetup')}
                </CardTitle>
                <CardDescription className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>
                  {t('adminAccountSetupDesc').replace('{appName}', formData.app_name)}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className={`${isDark ? 'text-zinc-300' : 'text-zinc-700'} ml-1`}>{t('fullName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <Input 
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className={`pl-10 h-11 focus:ring-zinc-500/20 rounded-xl transition-colors ${isDark ? 'bg-zinc-800/50 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className={`${isDark ? 'text-zinc-300' : 'text-zinc-700'} ml-1`}>{t('emailAddress')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <Input 
                        id="email"
                        name="email"
                        type="email"
                        placeholder="admin@example.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={`pl-10 h-11 focus:ring-zinc-500/20 rounded-xl transition-colors ${isDark ? 'bg-zinc-800/50 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className={`${isDark ? 'text-zinc-300' : 'text-zinc-700'} ml-1`}>{t('password')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                        <Input 
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          className={`pl-10 h-11 focus:ring-zinc-500/20 rounded-xl transition-colors ${isDark ? 'bg-zinc-800/50 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className={`${isDark ? 'text-zinc-300' : 'text-zinc-700'} ml-1`}>{t('confirmPassword')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                        <Input 
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`pl-10 h-11 focus:ring-zinc-500/20 rounded-xl transition-colors ${isDark ? 'bg-zinc-800/50 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* T&C acceptance */}
                  <div className={`space-y-3 pt-2 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <label className={`flex items-start gap-3 cursor-pointer group`}>
                      <input
                        type="checkbox"
                        checked={acceptPrivacy}
                        onChange={(e) => setAcceptPrivacy(e.target.checked)}
                        className="mt-0.5 accent-emerald-500 w-4 h-4 shrink-0"
                      />
                      <span className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {t('iAccept')}{' '}
                        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer"
                          className="text-emerald-500 hover:underline font-medium" onClick={e => e.stopPropagation()}>
                          {t('privacyPolicy')}
                        </a>
                      </span>
                    </label>
                    <label className={`flex items-start gap-3 cursor-pointer group`}>
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 accent-emerald-500 w-4 h-4 shrink-0"
                      />
                      <span className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {t('iAccept')}{' '}
                        <a href="/terms-of-service" target="_blank" rel="noopener noreferrer"
                          className="text-emerald-500 hover:underline font-medium" onClick={e => e.stopPropagation()}>
                          {t('termsOfService')}
                        </a>
                      </span>
                    </label>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 pb-8 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className={`flex-1 h-11 transition-colors ${isDark ? 'border-zinc-800 bg-transparent text-white hover:bg-zinc-800' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'}`}
                  >
                    <ChevronLeft className="mr-2 w-4 h-4" />
                    {t('back')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !acceptPrivacy || !acceptTerms}
                    className="flex-[2] h-11 text-white hover:opacity-90 font-semibold rounded-xl flex items-center justify-center transition-all shadow-lg disabled:opacity-50"
                    style={{ backgroundColor: formData.primary_color, boxShadow: `0 10px 15px -3px ${formData.primary_color}40` }}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : t('completeSetup')}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className={`text-xs font-medium tracking-widest uppercase opacity-50 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            v0.2.0 • {new Date().getFullYear()} {formData.app_name}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;

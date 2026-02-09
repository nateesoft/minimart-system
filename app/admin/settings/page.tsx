'use client';

import { useTranslations } from 'next-intl';
import { Sun, Moon, Monitor, Globe, Calendar, Check } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useSettings, type Language, type ThemePreference, type DateLocale } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const t = useTranslations();
  const { settings, updateSettings } = useSettings();
  const { setThemePreference } = useTheme();

  const handleThemeChange = (theme: ThemePreference) => {
    updateSettings({ theme });
    setThemePreference(theme);
  };

  const handleLanguageChange = (language: Language) => {
    updateSettings({ language });
  };

  const handleDateLocaleChange = (dateLocale: DateLocale) => {
    updateSettings({ dateLocale });
  };

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: 'th', label: t('settings.languages.th'), flag: '🇹🇭' },
    { id: 'en', label: t('settings.languages.en'), flag: '🇺🇸' },
  ];

  const themes: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: t('settings.themes.light'), icon: Sun },
    { id: 'dark', label: t('settings.themes.dark'), icon: Moon },
    { id: 'system', label: t('settings.themes.system'), icon: Monitor },
  ];

  const dateFormats: { id: DateLocale; label: string; example: string }[] = [
    { id: 'th-TH', label: t('settings.dateFormats.th'), example: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) },
    { id: 'en-US', label: t('settings.dateFormats.en'), example: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
            {t('settings.title')}
          </h1>

          <div className="space-y-6">
            {/* Language Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-xl">
                  <Globe className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {t('settings.language')}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={cn(
                      'flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all border-2',
                      settings.language === lang.id
                        ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium">{lang.label}</span>
                    </div>
                    {settings.language === lang.id && (
                      <Check className="text-blue-500" size={20} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-xl">
                  <Sun className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {t('settings.theme')}
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {themes.map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 px-4 py-4 rounded-xl transition-all border-2',
                        settings.theme === theme.id
                          ? 'bg-purple-50 dark:bg-purple-900/50 border-purple-500 text-purple-700 dark:text-purple-300'
                          : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <Icon size={28} />
                      <span className="font-medium">{theme.label}</span>
                      {settings.theme === theme.id && (
                        <Check className="text-purple-500" size={18} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Format Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-xl">
                  <Calendar className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {t('settings.dateFormat')}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {dateFormats.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => handleDateLocaleChange(format.id)}
                    className={cn(
                      'flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all border-2',
                      settings.dateLocale === format.id
                        ? 'bg-green-50 dark:bg-green-900/50 border-green-500 text-green-700 dark:text-green-300'
                        : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <div>
                      <span className="font-medium block">{format.label}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format.example}
                      </span>
                    </div>
                    {settings.dateLocale === format.id && (
                      <Check className="text-green-500" size={20} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

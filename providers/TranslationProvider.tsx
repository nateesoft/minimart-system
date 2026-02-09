'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useSettings } from '@/contexts/SettingsContext';
import thMessages from '@/messages/th.json';
import enMessages from '@/messages/en.json';

const messages = {
  th: thMessages,
  en: enMessages,
};

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const currentMessages = messages[settings.language];

  return (
    <NextIntlClientProvider
      locale={settings.language}
      messages={currentMessages}
      timeZone="Asia/Bangkok"
    >
      {children}
    </NextIntlClientProvider>
  );
}

'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShoppingCart, BarChart3, Package, Settings } from 'lucide-react';

export default function Home() {
  const t = useTranslations();

  const featureCards = [
    {
      icon: ShoppingCart,
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
      title: t('home.cards.pos.title'),
      description: t('home.cards.pos.description'),
    },
    {
      icon: Package,
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400',
      title: t('home.cards.stock.title'),
      description: t('home.cards.stock.description'),
    },
    {
      icon: BarChart3,
      iconBg: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400',
      title: t('home.cards.reports.title'),
      description: t('home.cards.reports.description'),
    },
    {
      icon: Settings,
      iconBg: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-400',
      title: t('home.cards.settings.title'),
      description: t('home.cards.settings.description'),
    },
  ];

  const features = [
    t('home.features.barcode'),
    t('home.features.search'),
    t('home.features.cart'),
    t('home.features.change'),
    t('home.features.stock'),
    t('home.features.lowStock'),
    t('home.features.payment'),
    t('home.features.ui'),
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-3xl shadow-2xl">
              <ShoppingCart size={64} className="text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {t('home.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {featureCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className={`${card.iconBg} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={card.iconColor} size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{card.description}</p>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link
            href="/pos"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-5 rounded-2xl text-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
          >
            <ShoppingCart size={28} />
            {t('home.startButton')}
          </Link>
        </div>

        {/* Features List */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-10">
            {t('home.featuresTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

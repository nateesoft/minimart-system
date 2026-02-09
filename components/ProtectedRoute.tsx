'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, ShieldOff } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
}

export default function ProtectedRoute({
  children,
  requiredPermissions,
  requiredRole,
}: ProtectedRouteProps) {
  const t = useTranslations();
  const { user, isLoading, hasAnyPermission, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={48} />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (!hasAnyPermission(requiredPermissions)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <ShieldOff className="text-red-500 mx-auto" size={64} />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-4 mb-2">
              {t('errors.unauthorized')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('errors.unauthorized')}
            </p>
            <button
              onClick={() => router.push('/pos')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('common.back')}
            </button>
          </div>
        </div>
      );
    }
  }

  // Check role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <ShieldOff className="text-red-500 mx-auto" size={64} />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-4 mb-2">
            {t('errors.unauthorized')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('errors.unauthorized')}
          </p>
          <button
            onClick={() => router.push('/pos')}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

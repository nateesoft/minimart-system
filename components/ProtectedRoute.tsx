'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldX } from 'lucide-react';

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
  const { user, isLoading, hasAnyPermission, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={48} />
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <ShieldX className="text-red-500 mx-auto" size={64} />
            <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-2">
              ไม่มีสิทธิ์เข้าถึง
            </h1>
            <p className="text-gray-600">คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</p>
            <button
              onClick={() => router.push('/pos')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      );
    }
  }

  // Check role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShieldX className="text-red-500 mx-auto" size={64} />
          <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-2">
            ไม่มีสิทธิ์เข้าถึง
          </h1>
          <p className="text-gray-600">
            ต้องการสิทธิ์ {requiredRole} ในการเข้าถึงหน้านี้
          </p>
          <button
            onClick={() => router.push('/pos')}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

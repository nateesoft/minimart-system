'use client';

import MinimartPOS from '@/components/minimart-pos';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function POSPage() {
  return (
    <ProtectedRoute requiredPermissions={['pos.access']}>
      <MinimartPOS />
    </ProtectedRoute>
  );
}

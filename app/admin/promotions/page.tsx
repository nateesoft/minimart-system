'use client';

import PromotionManagement from '@/components/promotion-management';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function PromotionsPage() {
  return (
    <ProtectedRoute requiredPermissions={['promotions.view', 'promotions.manage']}>
      <PromotionManagement />
    </ProtectedRoute>
  );
}

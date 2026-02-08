'use client';

import InventoryManagement from '@/components/inventory-management';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function InventoryPage() {
  return (
    <ProtectedRoute requiredPermissions={['inventory.view', 'inventory.manage']}>
      <InventoryManagement />
    </ProtectedRoute>
  );
}

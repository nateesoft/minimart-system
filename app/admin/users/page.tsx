'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import UserManagement from '@/components/user-management';

export default function UsersPage() {
  return (
    <ProtectedRoute requiredPermissions={['users.view', 'users.manage']}>
      <UserManagement />
    </ProtectedRoute>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingCart,
  Package,
  Tag,
  Users,
  BarChart3,
  Settings,
  LogOut,
  UserCog,
  Shield,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

interface MenuItem {
  path: string;
  labelKey: string;
  icon: LucideIcon;
  permissions: string[];
}

const menuItems: MenuItem[] = [
  {
    path: '/pos',
    labelKey: 'sidebar.pos',
    icon: ShoppingCart,
    permissions: ['pos.access'],
  },
  {
    path: '/admin/inventory',
    labelKey: 'sidebar.inventory',
    icon: Package,
    permissions: ['inventory.view', 'inventory.manage'],
  },
  {
    path: '/admin/promotions',
    labelKey: 'sidebar.promotions',
    icon: Tag,
    permissions: ['promotions.view', 'promotions.manage'],
  },
  {
    path: '/admin/members',
    labelKey: 'sidebar.members',
    icon: Users,
    permissions: ['members.view', 'members.manage'],
  },
  {
    path: '/admin/reports',
    labelKey: 'sidebar.reports',
    icon: BarChart3,
    permissions: ['reports.view'],
  },
  {
    path: '/admin/users',
    labelKey: 'sidebar.users',
    icon: UserCog,
    permissions: ['users.view', 'users.manage'],
  },
  {
    path: '/admin/roles',
    labelKey: 'sidebar.roles',
    icon: Shield,
    permissions: ['roles.manage'],
  },
  {
    path: '/admin/settings',
    labelKey: 'sidebar.settings',
    icon: Settings,
    permissions: ['settings.manage'],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const t = useTranslations();
  const { user, logout, hasAnyPermission } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const visibleMenuItems = menuItems.filter((item) =>
    hasAnyPermission(item.permissions)
  );

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggle?.();
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-gray-900 text-white min-h-screen flex flex-col transition-all duration-300`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <ShoppingCart size={24} />
              </div>
              <div>
                <h1 className="font-bold">{t('app.name')}</h1>
                <p className="text-xs text-gray-400">{t('app.tagline')}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleToggle}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className={`p-4 border-b border-gray-800 ${isCollapsed ? 'px-2' : ''}`}>
        <div
          className={`${
            isCollapsed ? 'p-2' : 'p-3'
          } bg-gray-800 rounded-xl text-center`}
        >
          {isCollapsed ? (
            <div className="w-10 h-10 mx-auto bg-blue-600 rounded-full flex items-center justify-center text-lg font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          ) : (
            <>
              <p className="font-semibold truncate">{user?.name}</p>
              <p className="text-sm text-gray-400 truncate">{user?.roleName}</p>
            </>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          const label = t(item.labelKey);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={isCollapsed ? label : undefined}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className={`flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-xl w-full transition-colors ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title={isCollapsed ? t('auth.logout') : undefined}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>{t('auth.logout')}</span>}
        </button>
      </div>
    </aside>
  );
}

/**
 * Sidebar Component providing high-contrast dark navigation.
 * Houses Binaire Freznel AI branding, primary route navigation,
 * current user profile, and sign-out controls.
 *
 * Binaire Freznel AI Assessment - Requirement #7
 */

import React from 'react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useModels } from '../../context/ModelContext';

interface SidebarProps {
  currentTab: 'models' | 'selected' | 'settings' | 'specs';
  onSelectTab: (tab: 'models' | 'selected' | 'settings' | 'specs') => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed = false,
}) => {
  const { currentUser, logout } = useAuth();
  const { selectedModel, models } = useModels();

  const navItems: Array<{
    id: 'models' | 'selected' | 'settings' | 'specs';
    label: string;
    icon: string;
    badge?: string | number;
  }> = [
    {
      id: 'models',
      label: 'Model Registry',
      icon: '⊞',
      badge: models.length,
    },
    {
      id: 'selected',
      label: 'Active Model',
      icon: '✓',
      badge: selectedModel ? '1' : undefined,
    },
    {
      id: 'specs',
      label: 'Architecture Specs',
      icon: '◈',
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: '⚙',
    },
  ];

  return (
    <nav
      style={{
        width: collapsed ? '64px' : '240px',
        backgroundColor: '#111111',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        height: '100%',
        borderRight: '1px solid #222222',
        transition: 'width 200ms ease',
        userSelect: 'none',
      }}
      aria-label="Application Navigation"
    >
      {/* Top Brand / Logo */}
      <div>
        <div
          style={{
            padding: collapsed ? '20px 14px' : '22px 20px',
            borderBottom: '1px solid #222222',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Logo collapsed={collapsed} size={collapsed ? 'small' : 'medium'} />
        </div>

        {/* Navigation List */}
        <div style={{ padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'space-between',
                  padding: collapsed ? '10px 0' : '9px 12px',
                  borderRadius: '4px',
                  backgroundColor: isActive ? '#222222' : 'transparent',
                  color: isActive ? '#ffffff' : '#999999',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  textAlign: 'left',
                  transition: 'background-color 150ms ease, color 150ms ease',
                  width: '100%',
                }}
                title={collapsed ? item.label : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px' }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </div>

                {!collapsed && item.badge !== undefined && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      backgroundColor: isActive ? '#333333' : '#1f1f1f',
                      color: isActive ? '#ffffff' : '#888888',
                      fontFamily: 'monospace',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom User Profile & Sign Out */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #222222',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {currentUser && !collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '3px',
                backgroundColor: '#262626',
                border: '1px solid #3a3a3a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              {(currentUser.displayName || currentUser.email || 'U').charAt(0)}
            </div>
            <div style={{ overflow: 'hidden', lineHeight: 1.2 }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentUser.displayName || 'AI Engineer'}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#777777',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentUser.email || 'Authenticated'}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={logout}
          style={{
            padding: collapsed ? '8px 0' : '7px 12px',
            backgroundColor: 'transparent',
            color: '#888888',
            border: '1px solid #2a2a2a',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            textAlign: 'center',
            transition: 'all 150ms ease',
            width: '100%',
          }}
          title="Sign Out of session"
        >
          {collapsed ? '⇥' : 'Sign Out'}
        </button>
      </div>
    </nav>
  );
};

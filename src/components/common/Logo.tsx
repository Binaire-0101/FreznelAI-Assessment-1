/**
 * Binaire Freznel AI Logo Component.
 * Minimalist geometric Fresnel lens & binary optical aperture iconography
 * with bold technical typography.
 */

import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark' | 'auto';
  collapsed?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'auto',
  collapsed = false,
  size = 'medium',
  className = '',
}) => {
  const iconSize = size === 'small' ? 24 : size === 'large' ? 36 : 28;

  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
      title="Binaire Freznel AI"
    >
      {/* High-contrast geometric Fresnel Lens & Binary Aperture Symbol */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Outer square frame */}
        <rect width="40" height="40" rx="3" fill="currentColor" />
        {/* Concentric high-contrast Fresnel optics */}
        <circle cx="20" cy="20" r="15" stroke="var(--bg-primary, #ffffff)" strokeWidth="1.75" />
        <circle cx="20" cy="20" r="10.5" stroke="var(--bg-primary, #ffffff)" strokeWidth="1.5" strokeDasharray="3 2" />
        <circle cx="20" cy="20" r="6" stroke="var(--bg-primary, #ffffff)" strokeWidth="1.5" />
        {/* Binary core aperture */}
        <circle cx="20" cy="20" r="2.5" fill="var(--bg-primary, #ffffff)" />
        {/* Orthogonal precision crosshairs */}
        <line x1="20" y1="2" x2="20" y2="7" stroke="var(--bg-primary, #ffffff)" strokeWidth="1.5" />
        <line x1="20" y1="33" x2="20" y2="38" stroke="var(--bg-primary, #ffffff)" strokeWidth="1.5" />
        <line x1="2" y1="20" x2="7" y2="20" stroke="var(--bg-primary, #ffffff)" strokeWidth="1.5" />
        <line x1="33" y1="20" x2="38" y2="20" stroke="var(--bg-primary, #ffffff)" strokeWidth="1.5" />
      </svg>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span
            style={{
              fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '13px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'currentColor',
            }}
          >
            Binaire Freznel
          </span>
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              opacity: 0.65,
              fontWeight: 500,
              color: 'currentColor',
            }}
          >
            Model Utility
          </span>
        </div>
      )}
    </div>
  );
};

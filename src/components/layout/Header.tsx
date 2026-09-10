/**
 * Header Component for the main Model Selection dashboard.
 * Houses title, connection status indicator, theme switcher,
 * comparison drawer trigger, and user account preview.
 *
 * Binaire Freznel AI Assessment - Requirements #8, #16
 */

import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useModels } from '../../context/ModelContext';
import { SortOption } from '../../types/model';
import { ModelSortService } from '../../services/ModelSortService';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenCompare: () => void;
  onToggleMobileFilter?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenCompare,
  onToggleMobileFilter,
}) => {
  const { currentUser } = useAuth();
  const { sortOption, setSortOption, compareModels, refreshModels, loading, isBackgroundSyncing } = useModels();

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      {/* Title & Subtitle */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onToggleMobileFilter && (
            <button
              type="button"
              onClick={onToggleMobileFilter}
              style={{
                display: 'inline-flex',
                padding: '6px 10px',
                fontSize: '12px',
                border: '1px solid var(--border-subtle)',
                borderRadius: '3px',
                backgroundColor: 'var(--bg-secondary)',
                cursor: 'pointer',
              }}
              className="md:hidden"
            >
              ☰ Filters
            </button>
          )}
          <h1
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Model Selection
          </h1>
        </div>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          Search, filter and compare available models.
        </p>
      </div>

      {/* Controls & User Account */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Sorting Dropdown (Requirement #13) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Sort:
          </span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            aria-label="Sort models"
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '3px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value={SortOption.NAME_ASC}>{ModelSortService.getSortLabel(SortOption.NAME_ASC)}</option>
            <option value={SortOption.NAME_DESC}>{ModelSortService.getSortLabel(SortOption.NAME_DESC)}</option>
            <option value={SortOption.PARAMETERS_ASC}>{ModelSortService.getSortLabel(SortOption.PARAMETERS_ASC)}</option>
            <option value={SortOption.PARAMETERS_DESC}>{ModelSortService.getSortLabel(SortOption.PARAMETERS_DESC)}</option>
            <option value={SortOption.SAFETENSOR_ASC}>{ModelSortService.getSortLabel(SortOption.SAFETENSOR_ASC)}</option>
            <option value={SortOption.SAFETENSOR_DESC}>{ModelSortService.getSortLabel(SortOption.SAFETENSOR_DESC)}</option>
            <option value={SortOption.FAMILY_ASC}>{ModelSortService.getSortLabel(SortOption.FAMILY_ASC)}</option>
            <option value={SortOption.DOWNLOADS_DESC}>{ModelSortService.getSortLabel(SortOption.DOWNLOADS_DESC)}</option>
          </select>
        </div>

        {/* Compare Models Trigger */}
        <button
          type="button"
          onClick={onOpenCompare}
          style={{
            padding: '6px 10px',
            fontSize: '12px',
            backgroundColor: compareModels.length > 0 ? 'var(--text-primary)' : 'var(--bg-secondary)',
            color: compareModels.length > 0 ? 'var(--bg-primary)' : 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '3px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500,
          }}
          title="Compare selected models side by side"
        >
          <span>⇄ Compare</span>
          {compareModels.length > 0 && (
            <span
              style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            >
              {compareModels.length}
            </span>
          )}
        </button>

        {/* Refresh button */}
        <button
          type="button"
          onClick={() => refreshModels(true)}
          disabled={loading || isBackgroundSyncing}
          style={{
            padding: '6px 10px',
            fontSize: '12px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '3px',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
          title="Fetch fresh model data from API"
        >
          {loading || isBackgroundSyncing ? '⟳ Fetching...' : '⟳ Refresh'}
        </button>

        {/* Online / Offline Status Badge */}
        <StatusBadge />

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          style={{
            padding: '6px 10px',
            fontSize: '12px',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '3px',
            cursor: 'pointer',
          }}
          title="Configure API URL, Cache, and Firebase credentials"
          aria-label="Settings"
        >
          ⚙ Settings
        </button>

        {/* Current user initials / avatar */}
        {currentUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              paddingLeft: '4px',
            }}
            title={`Logged in as ${currentUser.email || currentUser.displayName}`}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '3px',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textTransform: 'uppercase',
              }}
            >
              {(currentUser.displayName || currentUser.email || 'BF').charAt(0)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

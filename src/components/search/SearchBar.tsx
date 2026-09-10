/**
 * SearchBar Component implementing model name search and family selection.
 * Integrates custom debouncing utility and substring match.
 *
 * Binaire Freznel AI Assessment - Requirement #9, #21
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Flex, Picker, Item, ActionButton, Text } from '@adobe/react-spectrum';
import { useModels } from '../../context/ModelContext';
import { useDebounce } from '../../hooks/useDebounce';

export const SearchBar: React.FC = () => {
  const {
    filters,
    setSearchQuery,
    setFamilyFilter,
    availableFamilies,
    clearFilters,
    filteredModels,
    models,
  } = useModels();

  const [localQuery, setLocalQuery] = useState(filters.searchQuery);
  const debouncedQuery = useDebounce(localQuery, 250);

  // Sync external filter changes (e.g. clearFilters) to local input
  useEffect(() => {
    setLocalQuery(filters.searchQuery);
  }, [filters.searchQuery]);

  // Sync debounced query to context only when it actually differs
  useEffect(() => {
    if (debouncedQuery !== filters.searchQuery) {
      setSearchQuery(debouncedQuery);
    }
  }, [debouncedQuery, filters.searchQuery, setSearchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
  };

  const familyOptions = useMemo(() => {
    return ['ALL', ...availableFamilies];
  }, [availableFamilies]);

  return (
    <div
      style={{
        padding: '16px 20px',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flex: '1 1 320px', gap: '10px', alignItems: 'center' }}>
          {/* Custom high-contrast minimal search input */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 240px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={localQuery}
              onChange={handleInputChange}
              placeholder="Search model name, architecture, or tags (substring match)..."
              aria-label="Search models"
              style={{
                width: '100%',
                padding: '9px 36px 9px 34px',
                fontSize: '13px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 150ms ease',
              }}
            />
            {localQuery && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  padding: '4px',
                }}
                title="Clear query"
              >
                ✕
              </button>
            )}
          </div>

          {/* Model Family Picker */}
          <div style={{ minWidth: '150px' }}>
            <select
              value={filters.family}
              onChange={(e) => setFamilyFilter(e.target.value)}
              aria-label="Select Model Family"
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Families</option>
              {availableFamilies.map(fam => (
                <option key={fam} value={fam}>
                  {fam}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Counter & Quick Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontFamily: 'monospace',
            }}
          >
            {filteredModels.length} of {models.length} models
          </span>

          {(localQuery || filters.family !== 'ALL' || filters.pipelineTags.length > 0 || filters.architectureTags.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery('');
                clearFilters();
              }}
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

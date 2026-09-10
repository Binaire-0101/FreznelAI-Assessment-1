import React from 'react';
import { Search, X, SlidersHorizontal, Zap, Clock } from 'lucide-react';
import { FilterState, MatchType, SearchMode } from '../types';

interface SearchBarProps {
  filterState: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  resultCount: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filterState,
  onFilterChange,
  onResetFilters,
  resultCount
}) => {
  return (
    <div className="spectrum-SearchBar-container" style={{
      backgroundColor: 'var(--spectrum-global-color-gray-100)',
      border: '1px solid var(--spectrum-global-color-gray-300)',
      borderRadius: 'var(--spectrum-card-radius)',
      padding: '16px 20px',
      marginBottom: '20px',
      boxShadow: 'var(--spectrum-elevation-1)'
    }}>
      {/* Top Input Line */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <div className="spectrum-Textfield" style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--spectrum-global-color-gray-600)'
          }} />
          <input
            type="text"
            className="spectrum-Textfield-input"
            style={{ paddingLeft: '42px', paddingRight: filterState.searchQuery ? '40px' : '14px', height: '44px', fontSize: '15px' }}
            placeholder="Search AI models by name, family, description..."
            value={filterState.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          />
          {filterState.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--spectrum-global-color-gray-600)',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className="spectrum-Button spectrum-Button--secondary"
          onClick={onResetFilters}
          style={{ height: '44px', whiteSpace: 'nowrap' }}
        >
          Reset All Filters
        </button>
      </div>

      {/* Control Strip for Parameter, Substring Position, Debounce/Throttle */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid var(--spectrum-global-color-gray-200)',
        fontSize: '13px'
      }}>
        
        {/* Search Parameter Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--spectrum-global-color-gray-700)' }}>Search Field:</span>
          {(['all', 'name', 'family'] as SearchMode[]).map((mode) => (
            <button
              key={mode}
              className={`spectrum-Button ${filterState.searchMode === mode ? 'spectrum-Button--accent' : 'spectrum-Button--quiet'}`}
              style={{ padding: '4px 10px', fontSize: '12px', height: '28px', textTransform: 'capitalize' }}
              onClick={() => onFilterChange({ searchMode: mode })}
            >
              {mode === 'all' ? 'All Fields' : mode === 'name' ? 'Model Name' : 'Model Family'}
            </button>
          ))}
        </div>

        {/* Substring Match Position */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--spectrum-global-color-gray-700)' }}>Substring Match:</span>
          {(['any', 'start', 'middle'] as MatchType[]).map((match) => (
            <button
              key={match}
              className={`spectrum-Button ${filterState.matchType === match ? 'spectrum-Button--accent' : 'spectrum-Button--quiet'}`}
              style={{ padding: '4px 10px', fontSize: '12px', height: '28px', textTransform: 'capitalize' }}
              onClick={() => onFilterChange({ matchType: match })}
            >
              {match === 'any' ? 'Any Substring' : match === 'start' ? 'Start of String' : 'Middle of String'}
            </button>
          ))}
        </div>

        {/* Rate Limit Strategy (Debounce vs Throttle) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              className={`spectrum-Button ${filterState.useDebounce ? 'spectrum-Button--accent' : 'spectrum-Button--quiet'}`}
              style={{ padding: '4px 10px', fontSize: '12px', height: '28px' }}
              onClick={() => onFilterChange({ useDebounce: !filterState.useDebounce, useThrottle: false })}
            >
              <Clock size={12} />
              Debounce ({filterState.debounceMs}ms)
            </button>

            <button
              className={`spectrum-Button ${filterState.useThrottle ? 'spectrum-Button--accent' : 'spectrum-Button--quiet'}`}
              style={{ padding: '4px 10px', fontSize: '12px', height: '28px' }}
              onClick={() => onFilterChange({ useThrottle: !filterState.useThrottle, useDebounce: false })}
            >
              <Zap size={12} />
              Throttle ({filterState.throttleMs}ms)
            </button>
          </div>

          <span className="spectrum-Tag spectrum-Tag--blue" style={{ fontWeight: 700 }}>
            {resultCount} {resultCount === 1 ? 'Model' : 'Models'} Found
          </span>
        </div>

      </div>
    </div>
  );
};

/**
 * FilterPanel Component for multi-criteria filtering across:
 * - Pipeline tags
 * - Family tags
 * - Architecture tags
 * - Weight categories (Small, Medium, Large)
 * - Safetensor min / max thresholds
 *
 * Binaire Freznel AI Assessment - Requirement #12
 */

import React from 'react';
import { useModels } from '../../context/ModelContext';

interface FilterPanelProps {
  onCloseMobile?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ onCloseMobile }) => {
  const {
    filters,
    availablePipelines,
    availableFamilies,
    availableArchitectures,
    safetensorBounds,
    togglePipelineTag,
    toggleFamilyTag,
    toggleArchitectureTag,
    toggleWeightCategory,
    setSafetensorRange,
    clearFilters,
  } = useModels();

  const weightCategories = ['Small', 'Medium', 'Large'];

  return (
    <aside
      style={{
        width: '260px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
      }}
      aria-label="Model Filters"
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Filters
          </span>
        </div>
        <button
          type="button"
          onClick={clearFilters}
          style={{
            fontSize: '11px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Clear All
        </button>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Weight Classification */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
              color: 'var(--text-secondary)',
            }}
          >
            Weight / Size
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {weightCategories.map(cat => {
              const checked = filters.weightCategories.includes(cat);
              const label = cat === 'Small' ? 'Small (< 3B)' : cat === 'Medium' ? 'Medium (3B - 14B)' : 'Large (> 14B)';
              return (
                <label
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleWeightCategory(cat)}
                    style={{ accentColor: 'var(--text-primary)', cursor: 'pointer' }}
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Safetensor File Count Range */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Safetensors Range</span>
            <span style={{ fontFamily: 'monospace' }}>
              {filters.minSafetensors} - {filters.maxSafetensors > 0 ? filters.maxSafetensors : `${safetensorBounds.max}+`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block' }}>Min</label>
              <input
                type="number"
                min={0}
                max={safetensorBounds.max}
                value={filters.minSafetensors}
                onChange={(e) => setSafetensorRange(Math.max(0, parseInt(e.target.value) || 0), filters.maxSafetensors)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  fontSize: '12px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block' }}>Max</label>
              <input
                type="number"
                min={0}
                max={safetensorBounds.max + 50}
                value={filters.maxSafetensors || ''}
                placeholder="Any"
                onChange={(e) => setSafetensorRange(filters.minSafetensors, Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  fontSize: '12px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Pipeline Tags */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
              color: 'var(--text-secondary)',
            }}
          >
            Pipeline Tags ({availablePipelines.length})
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '160px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {availablePipelines.map(tag => {
              const checked = filters.pipelineTags.includes(tag);
              return (
                <label
                  key={tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePipelineTag(tag)}
                    style={{ accentColor: 'var(--text-primary)', cursor: 'pointer' }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tag}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Architecture Tags */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
              color: 'var(--text-secondary)',
            }}
          >
            Architecture ({availableArchitectures.length})
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '160px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {availableArchitectures.map(arch => {
              const checked = filters.architectureTags.includes(arch);
              return (
                <label
                  key={arch}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleArchitectureTag(arch)}
                    style={{ accentColor: 'var(--text-primary)', cursor: 'pointer' }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{arch}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Family Tags */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
              color: 'var(--text-secondary)',
            }}
          >
            Family Tags ({availableFamilies.length})
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '140px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {availableFamilies.map(fam => {
              const checked = filters.familyTags.includes(fam);
              return (
                <label
                  key={fam}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFamilyTag(fam)}
                    style={{ accentColor: 'var(--text-primary)', cursor: 'pointer' }}
                  />
                  <span>{fam}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {onCloseMobile && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onCloseMobile}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Apply Filters
          </button>
        </div>
      )}
    </aside>
  );
};

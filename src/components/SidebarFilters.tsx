import React, { useState } from 'react';
import { Filter, ArrowUpDown, ChevronDown, ChevronRight, Layers, Cpu, Box, HardDrive } from 'lucide-react';
import { FilterState, SortOption } from '../types';

interface SidebarFiltersProps {
  filterState: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  availableTags: {
    pipelines: string[];
    families: string[];
    architectures: string[];
    weights: string[];
    maxSafetensors: number;
  };
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  filterState,
  onFilterChange,
  sortOption,
  onSortChange,
  availableTags
}) => {
  const [openSections, setOpenSections] = useState({
    sorting: true,
    safetensors: true,
    pipeline: true,
    family: true,
    architecture: false,
    weight: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTag = (category: 'pipelineTags' | 'familyTags' | 'architectureTags' | 'weightTags', tag: string) => {
    const current = filterState[category];
    const exists = current.includes(tag);
    const updated = exists ? current.filter((t) => t !== tag) : [...current, tag];
    onFilterChange({ [category]: updated });
  };

  return (
    <aside style={{
      width: '300px',
      flexShrink: 0,
      backgroundColor: 'var(--spectrum-global-color-gray-100)',
      border: '1px solid var(--spectrum-global-color-gray-300)',
      borderRadius: 'var(--spectrum-card-radius)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: 'var(--spectrum-elevation-1)',
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--spectrum-global-color-gray-300)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Filter size={18} color="var(--spectrum-accent-color-200)" />
          Filters & Sorting
        </h2>
      </div>

      {/* 1. Sorting Section */}
      <div className="spectrum-Accordion-section">
        <button
          onClick={() => toggleSection('sorting')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: 'var(--spectrum-global-color-gray-900)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            padding: '6px 0'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={15} /> Sort Models
          </span>
          {openSections.sorting ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {openSections.sorting && (
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Sort Options */}
            {[
              { label: 'Name: A to Z', field: 'name', direction: 'asc' },
              { label: 'Name: Z to A', field: 'name', direction: 'desc' },
              { label: 'Safetensors: Low to High', field: 'safetensorCount', direction: 'asc' },
              { label: 'Safetensors: High to Low', field: 'safetensorCount', direction: 'desc' },
              { label: 'Downloads: High to Low', field: 'downloads', direction: 'desc' },
              { label: 'File Size: High to Low', field: 'safetensorSizeMB', direction: 'desc' }
            ].map((item) => {
              const isActive = sortOption.field === item.field && sortOption.direction === item.direction;
              return (
                <button
                  key={item.label}
                  onClick={() => onSortChange({ field: item.field as any, direction: item.direction as any })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--spectrum-border-radius)',
                    backgroundColor: isActive ? 'rgba(20, 115, 230, 0.15)' : 'var(--spectrum-global-color-gray-200)',
                    color: isActive ? 'var(--spectrum-accent-color-300)' : 'var(--spectrum-global-color-gray-800)',
                    border: isActive ? '1px solid var(--spectrum-accent-color-200)' : '1px solid transparent',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all var(--spectrum-transition-fast)'
                  }}
                >
                  {item.label}
                  {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--spectrum-accent-color-300)' }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <hr style={{ borderColor: 'var(--spectrum-global-color-gray-300)', borderStyle: 'solid', borderWidth: '0.5px' }} />

      {/* 2. Safetensor Range Slider Filter (Min to Max) */}
      <div className="spectrum-Accordion-section">
        <button
          onClick={() => toggleSection('safetensors')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: 'var(--spectrum-global-color-gray-900)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            padding: '6px 0'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HardDrive size={15} /> Safetensors (Min-Max)
          </span>
          {openSections.safetensors ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {openSections.safetensors && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
              <span>Min Files: {filterState.minSafetensorCount}</span>
              <span>Max Files: {filterState.maxSafetensorCount}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--spectrum-global-color-gray-600)' }}>Max Safetensor Files Limit:</label>
              <input
                type="range"
                min={1}
                max={availableTags.maxSafetensors || 50}
                value={filterState.maxSafetensorCount}
                onChange={(e) => onFilterChange({ maxSafetensorCount: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--spectrum-accent-color-200)', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}
      </div>

      <hr style={{ borderColor: 'var(--spectrum-global-color-gray-300)', borderStyle: 'solid', borderWidth: '0.5px' }} />

      {/* 3. Pipeline Tags */}
      <div className="spectrum-Accordion-section">
        <button
          onClick={() => toggleSection('pipeline')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: 'var(--spectrum-global-color-gray-900)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            padding: '6px 0'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={15} /> Pipeline Tags ({filterState.pipelineTags.length})
          </span>
          {openSections.pipeline ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {openSections.pipeline && (
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {availableTags.pipelines.map((tag) => {
              const selected = filterState.pipelineTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag('pipelineTags', tag)}
                  className={`spectrum-Tag ${selected ? 'spectrum-Tag--blue' : ''}`}
                  style={{
                    cursor: 'pointer',
                    border: selected ? '1px solid var(--spectrum-accent-color-200)' : '1px solid transparent',
                    padding: '4px 8px'
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <hr style={{ borderColor: 'var(--spectrum-global-color-gray-300)', borderStyle: 'solid', borderWidth: '0.5px' }} />

      {/* 4. Family Tags */}
      <div className="spectrum-Accordion-section">
        <button
          onClick={() => toggleSection('family')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: 'var(--spectrum-global-color-gray-900)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            padding: '6px 0'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={15} /> Family Tags ({filterState.familyTags.length})
          </span>
          {openSections.family ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {openSections.family && (
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {availableTags.families.map((tag) => {
              const selected = filterState.familyTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag('familyTags', tag)}
                  className={`spectrum-Tag ${selected ? 'spectrum-Tag--green' : ''}`}
                  style={{
                    cursor: 'pointer',
                    border: selected ? '1px solid var(--spectrum-semantic-positive)' : '1px solid transparent',
                    padding: '4px 8px',
                    textTransform: 'uppercase'
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <hr style={{ borderColor: 'var(--spectrum-global-color-gray-300)', borderStyle: 'solid', borderWidth: '0.5px' }} />

      {/* 5. Weight Tags */}
      <div className="spectrum-Accordion-section">
        <button
          onClick={() => toggleSection('weight')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            color: 'var(--spectrum-global-color-gray-900)',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            padding: '6px 0'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Box size={15} /> Weight Tags ({filterState.weightTags.length})
          </span>
          {openSections.weight ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {openSections.weight && (
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {availableTags.weights.map((tag) => {
              const selected = filterState.weightTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag('weightTags', tag)}
                  className={`spectrum-Tag ${selected ? 'spectrum-Tag--orange' : ''}`}
                  style={{
                    cursor: 'pointer',
                    border: selected ? '1px solid var(--spectrum-semantic-notice)' : '1px solid transparent',
                    padding: '4px 8px'
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

    </aside>
  );
};

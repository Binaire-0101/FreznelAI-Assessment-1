/**
 * ModelCard Component displaying technical model specifications,
 * tag chips, parameter weights, and selection triggers.
 *
 * Binaire Freznel AI Assessment - Requirement #14
 */

import React from 'react';
import { Model } from '../../models/Model';
import { useModels } from '../../context/ModelContext';

interface ModelCardProps {
  model: Model;
  onViewDetails: (model: Model) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onViewDetails }) => {
  const { selectedModel, selectModel, compareModels, toggleCompareModel } = useModels();

  const isSelected = selectedModel?.id === model.id;
  const isCompared = compareModels.some(m => m.id === model.id);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      selectModel(null);
    } else {
      selectModel(model);
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompareModel(model);
  };

  return (
    <div
      className={`bf-model-card transition-smooth ${isSelected ? 'is-selected' : ''}`}
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'default',
        position: 'relative',
      }}
    >
      <div>
        {/* Top Header: Family / Author / Selected Badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-secondary)',
              }}
            >
              {model.family}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {model.architectureTags[0] || 'Transformer'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {isSelected && (
              <span className="bf-badge bf-badge-dark" style={{ fontSize: '10px' }}>
                SELECTED
              </span>
            )}
          </div>
        </div>

        {/* Model Name */}
        <h3
          style={{
            margin: '0 0 6px 0',
            fontSize: '15px',
            fontWeight: 700,
            lineHeight: 1.3,
            color: 'var(--text-primary)',
            wordBreak: 'break-word',
          }}
        >
          {model.getDisplayName()}
        </h3>

        {/* Full Model ID / Author */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            fontFamily: 'monospace',
            marginBottom: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={model.id}
        >
          {model.id}
        </div>

        {/* Pipeline & Architecture Tags */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px',
            marginBottom: '14px',
          }}
        >
          {model.pipelineTags.slice(0, 2).map(tag => (
            <span key={tag} className="bf-badge">
              {tag}
            </span>
          ))}
          {model.architectureTags.slice(0, 1).map(arch => (
            <span key={arch} className="bf-badge bf-badge-accent">
              {arch}
            </span>
          ))}
        </div>

        {/* Key Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            padding: '8px 10px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '3px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Weight
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {model.weight}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Safetensors
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {model.safetensorFileCount} files
            </div>
          </div>
        </div>

        {/* Short Description */}
        <p
          style={{
            fontSize: '12px',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            margin: '0 0 16px 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '36px',
          }}
        >
          {model.description}
        </p>
      </div>

      {/* Card Actions */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => onViewDetails(model)}
          style={{
            flex: 1,
            padding: '7px 10px',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '3px',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'background-color 150ms ease',
          }}
          title="Inspect full model specifications and safetensor metadata"
        >
          View Details
        </button>

        <button
          type="button"
          onClick={handleSelect}
          style={{
            flex: 1,
            padding: '7px 10px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '3px',
            backgroundColor: isSelected ? 'var(--text-primary)' : 'var(--bg-secondary)',
            color: isSelected ? 'var(--bg-primary)' : 'var(--text-primary)',
            border: `1px solid ${isSelected ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          {isSelected ? 'Deselect' : 'Select Model'}
        </button>

        <button
          type="button"
          onClick={handleCompare}
          title={isCompared ? 'Remove from side-by-side comparison' : 'Add to side-by-side comparison'}
          style={{
            padding: '7px 9px',
            fontSize: '12px',
            borderRadius: '3px',
            backgroundColor: isCompared ? 'var(--text-primary)' : 'transparent',
            color: isCompared ? 'var(--bg-primary)' : 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          ⇄
        </button>
      </div>
    </div>
  );
};

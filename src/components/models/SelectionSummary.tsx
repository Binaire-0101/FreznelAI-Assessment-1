/**
 * SelectionSummary Component displaying active persistent model selection
 * and quick deselect/change controls.
 *
 * Binaire Freznel AI Assessment - Requirement #16
 */

import React from 'react';
import { useModels } from '../../context/ModelContext';
import { Model } from '../../models/Model';

interface SelectionSummaryProps {
  onViewDetails: (model: Model) => void;
}

export const SelectionSummary: React.FC<SelectionSummaryProps> = ({ onViewDetails }) => {
  const { selectedModel, selectModel } = useModels();

  if (!selectedModel) return null;

  return (
    <div
      style={{
        padding: '10px 20px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          Selected Model:
        </span>

        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {selectedModel.getDisplayName()}
        </span>

        <span className="bf-badge bf-badge-dark" style={{ fontSize: '10px' }}>
          {selectedModel.weight}
        </span>

        <span className="bf-badge" style={{ fontSize: '10px' }}>
          {selectedModel.safetensorFileCount} safetensors
        </span>

        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          {selectedModel.family} / {selectedModel.architectureTags[0] || 'Transformer'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={() => onViewDetails(selectedModel)}
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            borderRadius: '3px',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          View Specs
        </button>

        <button
          type="button"
          onClick={() => selectModel(null)}
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            borderRadius: '3px',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
          }}
        >
          Change Model
        </button>
      </div>
    </div>
  );
};

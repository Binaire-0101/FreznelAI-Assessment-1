/**
 * ActiveSelectedView Component displaying the currently selected model.
 * Fulfills Requirement #16 for dedicated inspection and confirmation of chosen model.
 */

import React from 'react';
import { useModels } from '../../context/ModelContext';
import { Model } from '../../models/Model';

interface ActiveSelectedViewProps {
  onBrowseRegistry: () => void;
  onViewDetails: (model: Model) => void;
}

export const ActiveSelectedView: React.FC<ActiveSelectedViewProps> = ({
  onBrowseRegistry,
  onViewDetails,
}) => {
  const { selectedModel, selectModel } = useModels();

  if (!selectedModel) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            marginBottom: '16px',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          ✓
        </div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>
          No Model Currently Selected
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px' }}>
          Select an appropriate model from the registry to configure your AI infrastructure, evaluate safetensor files, or compare characteristics.
        </p>
        <button
          type="button"
          onClick={onBrowseRegistry}
          style={{
            padding: '9px 24px',
            fontSize: '13px',
            fontWeight: 600,
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
          }}
        >
          Browse Model Registry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px', maxWidth: '840px', margin: '0 auto' }}>
      <div
        style={{
          border: '2px solid var(--text-primary)',
          borderRadius: '4px',
          backgroundColor: 'var(--bg-primary)',
          overflow: 'hidden',
        }}
      >
        {/* Banner */}
        <div
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>✓</span>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Selected AI Infrastructure Model
            </span>
          </div>
          <button
            type="button"
            onClick={() => selectModel(null)}
            style={{
              padding: '3px 10px',
              fontSize: '11px',
              backgroundColor: 'transparent',
              color: 'var(--bg-primary)',
              border: '1px solid var(--bg-primary)',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          >
            Deselect Model
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="bf-badge" style={{ marginBottom: '8px' }}>
                {selectedModel.family} / {selectedModel.architectureTags[0]}
              </span>
              <h1 style={{ margin: '4px 0', fontSize: '24px', fontWeight: 700 }}>
                {selectedModel.getDisplayName()}
              </h1>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {selectedModel.id}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => onViewDetails(selectedModel)}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                Inspect Specs
              </button>
            </div>
          </div>

          <p style={{ margin: '16px 0 24px 0', fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {selectedModel.description}
          </p>

          {/* Key Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Weight</div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{selectedModel.weight}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedModel.getParameterCount()}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Safetensors</div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{selectedModel.safetensorFileCount} files</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Non-pickle validated</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Context Window</div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{selectedModel.contextWindow.toLocaleString()}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tokens</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Safety Score</div>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{selectedModel.getSafetyScore()}/100</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {selectedModel.pipelineTags.map(tag => (
              <span key={tag} className="bf-badge">
                {tag}
              </span>
            ))}
            {selectedModel.architectureTags.map(arch => (
              <span key={arch} className="bf-badge bf-badge-accent">
                {arch}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onBrowseRegistry}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              Browse Other Models
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

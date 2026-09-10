/**
 * ModelDetailsPage Component for dedicated full-page or standalone model inspection.
 * Binaire Freznel AI Assessment
 */

import React from 'react';
import { useModels } from '../context/ModelContext';
import { Model } from '../models/Model';

interface ModelDetailsPageProps {
  modelId?: string;
  onBack?: () => void;
}

export const ModelDetailsPage: React.FC<ModelDetailsPageProps> = ({ modelId, onBack }) => {
  const { models, selectedModel, selectModel } = useModels();

  const targetModel: Model | undefined = modelId
    ? models.find(m => m.id === modelId)
    : selectedModel || models[0];

  if (!targetModel) {
    return (
      <div style={{ padding: '32px', color: 'var(--text-primary)' }}>
        <p>No model found.</p>
        {onBack && (
          <button type="button" onClick={onBack} style={{ cursor: 'pointer' }}>
            ← Back to Registry
          </button>
        )}
      </div>
    );
  }

  const isSelected = selectedModel?.id === targetModel.id;

  return (
    <div
      style={{
        padding: '32px',
        maxWidth: '900px',
        margin: '0 auto',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
      }}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            marginBottom: '20px',
            background: 'none',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            padding: '6px 12px',
            borderRadius: '3px',
            cursor: 'pointer',
          }}
        >
          ← Back to Registry
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 700 }}>
            {targetModel.getDisplayName()}
          </h1>
          <div style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {targetModel.id}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {targetModel.repoUrl && (
            <a
              href={targetModel.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '3px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
              }}
            >
              Open Hugging Face Repository ↗
            </a>
          )}

          <button
            type="button"
            onClick={() => selectModel(isSelected ? null : targetModel)}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '3px',
              backgroundColor: isSelected ? 'transparent' : 'var(--text-primary)',
              color: isSelected ? 'var(--text-primary)' : 'var(--bg-primary)',
              border: '1px solid var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {isSelected ? 'Deselect Model' : 'Select as Active Model'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
          Overview
        </h3>
        <p style={{ lineHeight: 1.6, color: 'var(--text-primary)' }}>{targetModel.description}</p>
      </div>

      <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
          Specifications
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Weight / Category</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{targetModel.weight} ({targetModel.getWeightCategory()})</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Safetensors Count</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{targetModel.safetensorFileCount} files</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Architecture</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{targetModel.architecture}</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>License</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{targetModel.license}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

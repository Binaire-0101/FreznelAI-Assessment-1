/**
 * ModelDetailDialog Component providing in-depth model specifications,
 * safetensor metrics, framework, quantization, CLI commands, and Hugging Face link.
 *
 * Binaire Freznel AI Assessment - Requirement #15
 */

import React, { useState } from 'react';
import { Model } from '../../models/Model';
import { useModels } from '../../context/ModelContext';

interface ModelDetailDialogProps {
  model: Model | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModelDetailDialog: React.FC<ModelDetailDialogProps> = ({
  model,
  isOpen,
  onClose,
}) => {
  const { selectedModel, selectModel } = useModels();
  const [copiedCli, setCopiedCli] = useState(false);

  if (!isOpen || !model) return null;

  const isSelected = selectedModel?.id === model.id;

  const handleSelectToggle = () => {
    if (isSelected) {
      selectModel(null);
    } else {
      selectModel(model);
    }
  };

  const handleCopyCli = () => {
    if (model.cliDownloadCommand) {
      navigator.clipboard.writeText(model.cliDownloadCommand);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="model-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              Model Specification / {model.family}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px 8px',
            }}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Title & ID */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h2
                id="model-detail-title"
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {model.getDisplayName()}
              </h2>
              {isSelected && (
                <span className="bf-badge bf-badge-dark">
                  ACTIVE SELECTION
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--text-secondary)',
                wordBreak: 'break-all',
              }}
            >
              Repository: {model.huggingfaceRepo || model.id}
            </div>
          </div>

          {/* External Link: Open Hugging Face Repository */}
          {model.repoUrl && (
            <div>
              <a
                href={model.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '3px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  textDecoration: 'none',
                  transition: 'border-color 150ms ease',
                }}
              >
                <span>Open Hugging Face Repository</span>
                <span>↗</span>
              </a>
            </div>
          )}

          {/* CLI Download Command */}
          {model.cliDownloadCommand && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '3px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>CLI Download Command</span>
                <button
                  type="button"
                  onClick={handleCopyCli}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  {copiedCli ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <code
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#10b981',
                  wordBreak: 'break-all',
                }}
              >
                {model.cliDownloadCommand}
              </code>
            </div>
          )}

          {/* Technical Specifications Grid */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
                color: 'var(--text-secondary)',
              }}
            >
              Architecture & Model Specs
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
              }}
            >
              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Weight</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{model.weight}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{model.getWeightCategory()} Category</div>
              </div>

              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Safetensors</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{model.safetensorFileCount} files</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Native safe tensor</div>
              </div>

              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Architecture</div>
                <div style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {model.architecture}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{model.pytorchArchitecture}</div>
              </div>

              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Weight Format</div>
                <div style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {model.weightFormat}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Precision / Gating</div>
              </div>

              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>License</div>
                <div style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {model.license}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Author: {model.authorNamespace}</div>
              </div>

              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                }}
              >
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Framework</div>
                <div style={{ fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {model.framework.join(', ') || 'PyTorch'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Compatible</div>
              </div>
            </div>
          </div>

          {/* Tags Breakdown */}
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
              Tags & HF Classifications
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', width: '90px', color: 'var(--text-secondary)' }}>Pipeline:</span>
                {model.pipelineTags.map(tag => (
                  <span key={tag} className="bf-badge">
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', width: '90px', color: 'var(--text-secondary)' }}>Family:</span>
                {model.familyTags.map(fam => (
                  <span key={fam} className="bf-badge">
                    {fam}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', width: '90px', color: 'var(--text-secondary)' }}>Architecture:</span>
                {model.architectureTags.map(arch => (
                  <span key={arch} className="bf-badge bf-badge-accent">
                    {arch}
                  </span>
                ))}
              </div>
              {model.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', width: '90px', color: 'var(--text-secondary)' }}>All Tags:</span>
                  {model.tags.slice(0, 15).map(tag => (
                    <span key={tag} className="bf-badge" style={{ fontSize: '10px' }}>
                      {tag}
                    </span>
                  ))}
                  {model.tags.length > 15 && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      +{model.tags.length - 15} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Use Case: <strong style={{ color: 'var(--text-primary)' }}>{model.useCase}</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                borderRadius: '3px',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSelectToggle}
              style={{
                padding: '8px 20px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '3px',
                backgroundColor: isSelected ? 'transparent' : 'var(--text-primary)',
                color: isSelected ? 'var(--text-primary)' : 'var(--bg-primary)',
                border: '1px solid var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {isSelected ? 'Deselect Model' : 'Select this model'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

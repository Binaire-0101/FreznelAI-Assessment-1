/**
 * ModelCompareModal Component for side-by-side technical comparison of candidate models.
 */

import React from 'react';
import { Model } from '../../models/Model';
import { useModels } from '../../context/ModelContext';

interface ModelCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: (model: Model) => void;
}

export const ModelCompareModal: React.FC<ModelCompareModalProps> = ({
  isOpen,
  onClose,
  onViewDetails,
}) => {
  const { compareModels, toggleCompareModel, selectModel, selectedModel, clearCompareModels } = useModels();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              Side-by-Side Model Comparison ({compareModels.length}/3)
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Evaluate architectural trade-offs, weights, and safetensor densities
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {compareModels.length > 0 && (
              <button
                type="button"
                onClick={clearCompareModels}
                style={{
                  fontSize: '11px',
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  padding: '4px 8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Comparison Grid */}
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          {compareModels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                No models currently selected for comparison. Click the ⇄ button on any model card to compare characteristics.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${compareModels.length}, 1fr)`,
                gap: '16px',
              }}
            >
              {compareModels.map((m) => {
                const isSelected = selectedModel?.id === m.id;
                return (
                  <div
                    key={m.id}
                    style={{
                      border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      backgroundColor: 'var(--bg-secondary)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="bf-badge">{m.family}</span>
                      <button
                        type="button"
                        onClick={() => toggleCompareModel(m)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700 }}>
                        {m.getDisplayName()}
                      </h4>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {m.id}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Weight:</span>
                        <span style={{ fontWeight: 600 }}>{m.weight}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Safetensors:</span>
                        <span style={{ fontWeight: 600 }}>{m.safetensorFileCount}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Context:</span>
                        <span style={{ fontWeight: 600 }}>{m.contextWindow.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Precision:</span>
                        <span style={{ fontWeight: 600 }}>{m.precision}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Safety Score:</span>
                        <span style={{ fontWeight: 600 }}>{m.getSafetyScore()}/100</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>License:</span>
                        <span style={{ fontWeight: 600 }}>{m.license}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          onViewDetails(m);
                          onClose();
                        }}
                        style={{
                          padding: '6px',
                          fontSize: '11px',
                          borderRadius: '3px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => selectModel(isSelected ? null : m)}
                        style={{
                          padding: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '3px',
                          backgroundColor: isSelected ? 'transparent' : 'var(--text-primary)',
                          color: isSelected ? 'var(--text-primary)' : 'var(--bg-primary)',
                          border: '1px solid var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected ? 'Deselect' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

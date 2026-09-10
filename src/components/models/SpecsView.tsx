/**
 * SpecsView Component displaying analytical architecture distributions,
 * parameter ranges, and safetensor densities across the loaded registry.
 */

import React from 'react';
import { useModels } from '../../context/ModelContext';

export const SpecsView: React.FC = () => {
  const { models, availableFamilies, availableArchitectures, safetensorBounds } = useModels();

  // Compute family counts
  const familyCounts = availableFamilies.map(fam => ({
    family: fam,
    count: models.filter(m => m.family.toLowerCase() === fam.toLowerCase()).length,
  }));

  // Compute architecture counts
  const archCounts = availableArchitectures.map(arch => ({
    arch,
    count: models.filter(m => m.architectureTags.some(a => a.toLowerCase() === arch.toLowerCase())).length,
  }));

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700 }}>
          Registry Architectural Specifications
        </h2>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
          Detailed breakdown of model families, transformer architectures, and safetensor parameters.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Total Models
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>{models.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified weights</div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Model Families
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>{availableFamilies.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Frontier & Open</div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Architectures
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>{availableArchitectures.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MoE, Dense, Diffusion</div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Safetensor Range
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0' }}>
            {safetensorBounds.min} - {safetensorBounds.max}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Files per model</div>
        </div>
      </div>

      {/* Two column breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Family Breakdown */}
        <div
          style={{
            padding: '20px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 700 }}>
            Family Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {familyCounts.map(({ family, count }) => (
              <div key={family}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{family}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{count} models</span>
                </div>
                <div
                  style={{
                    height: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (count / models.length) * 100)}%`,
                      backgroundColor: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture Breakdown */}
        <div
          style={{
            padding: '20px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 700 }}>
            Architecture Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {archCounts.map(({ arch, count }) => (
              <div key={arch}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{arch}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{count} models</span>
                </div>
                <div
                  style={{
                    height: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (count / models.length) * 100)}%`,
                      backgroundColor: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

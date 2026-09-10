import React from 'react';
import { Download, ThumbsUp, HardDrive, Cpu, ExternalLink, Calendar, ShieldCheck } from 'lucide-react';
import { AIModel } from '../types';

interface ModelCardProps {
  model: AIModel;
  onSelectModel: (model: AIModel) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onSelectModel }) => {
  const formattedDownloads = new Intl.NumberFormat('en-US', { notation: 'compact' }).format(model.downloads);
  const formattedLikes = new Intl.NumberFormat('en-US', { notation: 'compact' }).format(model.likes);
  const sizeGB = (model.safetensorSizeMB / 1024).toFixed(1);

  return (
    <div className="spectrum-Card" style={{ height: '100%' }}>
      <div>
        {/* Card Header & Title */}
        <div className="spectrum-Card-header">
          <div>
            <div className="spectrum-Card-subtitle">{model.author}</div>
            <h3 className="spectrum-Card-title" style={{ fontSize: '15px', color: 'var(--spectrum-accent-color-300)' }}>
              {model.name}
            </h3>
          </div>
          <span className="spectrum-Tag spectrum-Tag--green" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
            {model.family}
          </span>
        </div>

        {/* Description */}
        <p className="spectrum-Card-description">
          {model.description}
        </p>

        {/* Filter Tag Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          <span className="spectrum-Tag spectrum-Tag--blue">
            <Cpu size={10} /> {model.pipelineTag}
          </span>
          <span className="spectrum-Tag">
            {model.architectureTag}
          </span>
          <span className="spectrum-Tag spectrum-Tag--orange">
            {model.weightTag}
          </span>
        </div>
      </div>

      {/* Metrics Strip & Action Footer */}
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          padding: '10px',
          backgroundColor: 'var(--spectrum-global-color-gray-200)',
          borderRadius: 'var(--spectrum-border-radius)',
          marginBottom: '14px',
          fontSize: '11px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ color: 'var(--spectrum-global-color-gray-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <HardDrive size={12} /> Safetensors
            </div>
            <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: 'var(--spectrum-global-color-gray-900)' }}>
              {model.safetensorCount} files ({sizeGB} GB)
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--spectrum-global-color-gray-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Download size={12} /> Downloads
            </div>
            <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: 'var(--spectrum-global-color-gray-900)' }}>
              {formattedDownloads}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--spectrum-global-color-gray-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <ThumbsUp size={12} /> Likes
            </div>
            <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: 'var(--spectrum-global-color-gray-900)' }}>
              {formattedLikes}
            </div>
          </div>
        </div>

        <button
          className="spectrum-Button spectrum-Button--secondary"
          onClick={() => onSelectModel(model)}
          style={{ width: '100%', fontSize: '13px', height: '36px' }}
        >
          <ExternalLink size={14} /> View Details & API Payload
        </button>
      </div>
    </div>
  );
};

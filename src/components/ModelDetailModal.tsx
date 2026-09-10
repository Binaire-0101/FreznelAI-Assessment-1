import React, { useState } from 'react';
import { X, HardDrive, Download, Cpu, ShieldCheck, Code, CheckCircle, RefreshCw } from 'lucide-react';
import { AIModel } from '../types';
import { BackgroundFetchManager } from '../utils/BackgroundFetchManager';

interface ModelDetailModalProps {
  model: AIModel | null;
  onClose: () => void;
}

export const ModelDetailModal: React.FC<ModelDetailModalProps> = ({ model, onClose }) => {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadLog, setDownloadLog] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!model) return null;

  const bgManager = new BackgroundFetchManager();

  const handleSimulateSafeDownload = () => {
    setIsVerifying(true);
    setDownloadProgress(10);
    setDownloadLog([
      `[Safe Download] Initiating background stream fetch for ${model.name}...`,
      `[Checksum Protocol] Requesting SHA-256 integrity header...`
    ]);

    setTimeout(() => setDownloadProgress(40), 200);
    setTimeout(() => setDownloadProgress(75), 450);

    bgManager.simulateChunkedDownloadWithChecksum('/data/models.json').then((res) => {
      setDownloadProgress(100);
      setIsVerifying(false);
      setDownloadLog(res.logs);
    });
  };

  return (
    <div className="spectrum-Modal-backdrop" onClick={onClose}>
      <div className="spectrum-Dialog" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <span className="spectrum-Tag spectrum-Tag--green" style={{ textTransform: 'uppercase', marginBottom: '6px' }}>
              {model.family} Architecture
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--spectrum-accent-color-300)', marginTop: '4px' }}>
              {model.name}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--spectrum-global-color-gray-600)', marginTop: '2px' }}>
              Created by {model.author} • Updated {model.updatedAt} • License: {model.license}
            </p>
          </div>
          <button
            className="spectrum-Button spectrum-Button--quiet"
            onClick={onClose}
            style={{ padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Overview & Metadata Table */}
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--spectrum-global-color-gray-800)', marginBottom: '20px' }}>
          {model.description}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: 'var(--spectrum-global-color-gray-200)',
          borderRadius: 'var(--spectrum-border-radius)'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--spectrum-global-color-gray-600)' }}>Pipeline Tag</span>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{model.pipelineTag}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--spectrum-global-color-gray-600)' }}>Architecture Tag</span>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{model.architectureTag}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--spectrum-global-color-gray-600)' }}>Weight Quantization Tag</span>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{model.weightTag}</div>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--spectrum-global-color-gray-600)' }}>Safetensors Count & Size</span>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>{model.safetensorCount} files ({(model.safetensorSizeMB / 1024).toFixed(1)} GB)</div>
          </div>
        </div>

        {/* Safe Chunked Stream Download Simulation Button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            className="spectrum-Button spectrum-Button--accent"
            onClick={handleSimulateSafeDownload}
            disabled={isVerifying}
            style={{ width: '100%', padding: '12px', fontSize: '14px' }}
          >
            {isVerifying ? <RefreshCw size={16} className="spin" /> : <ShieldCheck size={16} />}
            Test Chunked Stream Download & Integrity Check
          </button>

          {downloadProgress !== null && (
            <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'var(--spectrum-global-color-gray-200)', borderRadius: 'var(--spectrum-border-radius)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                <span>Download & Checksum Progress</span>
                <span>{downloadProgress}%</span>
              </div>
              <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--spectrum-global-color-gray-300)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${downloadProgress}%`, backgroundColor: 'var(--spectrum-semantic-positive)', transition: 'width 0.3s' }} />
              </div>

              {downloadLog.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  fontFamily: 'var(--spectrum-code-font)',
                  fontSize: '11px',
                  color: 'var(--spectrum-global-color-gray-800)',
                  backgroundColor: 'var(--spectrum-global-color-gray-50)',
                  padding: '8px',
                  borderRadius: '4px'
                }}>
                  {downloadLog.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Raw JSON Payload */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code size={15} /> Model API Schema Payload
          </h4>
          <pre style={{
            fontFamily: 'var(--spectrum-code-font)',
            fontSize: '12px',
            padding: '14px',
            backgroundColor: 'var(--spectrum-global-color-gray-50)',
            border: '1px solid var(--spectrum-global-color-gray-300)',
            borderRadius: 'var(--spectrum-border-radius)',
            overflowX: 'auto',
            maxHeight: '180px'
          }}>
            {JSON.stringify(model, null, 2)}
          </pre>
        </div>

      </div>
    </div>
  );
};

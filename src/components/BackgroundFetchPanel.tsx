import React, { useState } from 'react';
import { X, Play, Code2, ShieldCheck, CheckCircle2, FileCode, Layers, Cpu } from 'lucide-react';
import { BackgroundFetchManager } from '../utils/BackgroundFetchManager';
import { BackgroundFetchResult } from '../types';

interface BackgroundFetchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackgroundFetchPanel: React.FC<BackgroundFetchPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'q1' | 'q2'>('q1');
  const [executionResult, setExecutionResult] = useState<BackgroundFetchResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const bgManager = new BackgroundFetchManager();

  const handleTestPromiseThen = () => {
    setIsRunning(true);
    setExecutionResult(null);
    bgManager.fetchWithoutAsyncAwaitPromise('/data/models.json', (result) => {
      setIsRunning(false);
      setExecutionResult(result);
    });
  };

  const handleTestXHR = () => {
    setIsRunning(true);
    setExecutionResult(null);
    bgManager.fetchWithoutAsyncAwaitXHR('/data/models.json', (result) => {
      setIsRunning(false);
      setExecutionResult(result);
    });
  };

  const handleTestChunkedChecksum = () => {
    setIsRunning(true);
    setExecutionResult(null);
    bgManager.simulateChunkedDownloadWithChecksum('/data/models.json').then((result) => {
      setIsRunning(false);
      setExecutionResult(result);
    });
  };

  return (
    <div className="spectrum-Modal-backdrop" onClick={onClose}>
      <div className="spectrum-Dialog" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <span className="spectrum-Tag spectrum-Tag--blue">Technical Architecture</span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>
              Background Fetch & Data Integrity Solutions
            </h2>
          </div>
          <button className="spectrum-Button spectrum-Button--quiet" onClick={onClose} style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--spectrum-global-color-gray-300)',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => { setActiveTab('q1'); setExecutionResult(null); }}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === 'q1' ? '2px solid var(--spectrum-accent-color-300)' : '2px solid transparent',
              background: 'none',
              color: activeTab === 'q1' ? 'var(--spectrum-accent-color-300)' : 'var(--spectrum-global-color-gray-700)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Q1: Non Async-Await Solutions
          </button>
          <button
            onClick={() => { setActiveTab('q2'); setExecutionResult(null); }}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: activeTab === 'q2' ? '2px solid var(--spectrum-accent-color-300)' : '2px solid transparent',
              background: 'none',
              color: activeTab === 'q2' ? 'var(--spectrum-accent-color-300)' : 'var(--spectrum-global-color-gray-700)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Q2: Large JSON Safety & Anti-Corruption
          </button>
        </div>

        {/* Q1 Content */}
        {activeTab === 'q1' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', color: 'var(--spectrum-accent-color-300)' }}>
              1. How will you solve background fetch API without using `async-await`?
            </h3>
            
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--spectrum-global-color-gray-800)', marginBottom: '16px' }}>
              Background fetching without <code>async/await</code> can be solved using three robust Object-Oriented patterns:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--spectrum-global-color-gray-200)', borderRadius: '6px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Code2 size={14} color="var(--spectrum-accent-color-300)" />
                  1. Promise .then() Chaining
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-700)' }}>
                  Using standard ES6 Promises with <code>.then()</code> and <code>.catch()</code> methods to asynchronously pipeline requests without blocking the main event loop.
                </p>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--spectrum-global-color-gray-200)', borderRadius: '6px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <FileCode size={14} color="var(--spectrum-semantic-positive)" />
                  2. XMLHttpRequest Callbacks
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-700)' }}>
                  Leveraging <code>XMLHttpRequest</code> with <code>onreadystatechange</code> and <code>onprogress</code> event listeners for granular event-driven downloads.
                </p>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--spectrum-global-color-gray-200)', borderRadius: '6px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Layers size={14} color="var(--spectrum-semantic-notice)" />
                  3. Event Emitter Pattern
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-700)' }}>
                  Emitting custom data stream events so UI subscribers reactively update without synchronous pausing or awaiting.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                className="spectrum-Button spectrum-Button--accent"
                onClick={handleTestPromiseThen}
                disabled={isRunning}
                style={{ fontSize: '13px' }}
              >
                <Play size={14} /> Run Promise .then() Test
              </button>
              <button
                className="spectrum-Button spectrum-Button--secondary"
                onClick={handleTestXHR}
                disabled={isRunning}
                style={{ fontSize: '13px' }}
              >
                <Play size={14} /> Run XMLHttpRequest Test
              </button>
            </div>
          </div>
        )}

        {/* Q2 Content */}
        {activeTab === 'q2' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', color: 'var(--spectrum-semantic-positive)' }}>
              2. If the JSON file is large, how will you assure its safety and prevent corruption during download?
            </h3>
            
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--spectrum-global-color-gray-800)', marginBottom: '16px' }}>
              To ensure 100% data integrity and eliminate JSON file corruption during large background downloads, we employ a 4-layer defense system:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--spectrum-global-color-gray-200)', borderRadius: '6px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--spectrum-accent-color-300)', marginBottom: '4px' }}>
                  A. Cryptographic SHA-256 Checksum
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-700)' }}>
                  Calculating cryptographic SHA-256 digest of received bytes and matching against HTTP ETag / Content-MD5 before parsing.
                </p>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--spectrum-global-color-gray-200)', borderRadius: '6px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--spectrum-semantic-positive)', marginBottom: '4px' }}>
                  B. ReadableStream Chunking
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-700)' }}>
                  Downloading payload in fixed-size chunks via <code>ReadableStreamReader</code> while tracking accumulated length against <code>Content-Length</code>.
                </p>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--spectrum-global-color-gray-200)', borderRadius: '6px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--spectrum-semantic-notice)', marginBottom: '4px' }}>
                  C. Atomic Storage Write
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-700)' }}>
                  Writing valid data to IndexedDB inside a single atomic transaction ONLY after complete validation, preventing partial writes.
                </p>
              </div>

              <div style={{ padding: '14px', backgroundColor: 'var(--spectrum-global-color-gray-200)', borderRadius: '6px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#a060ff', marginBottom: '4px' }}>
                  D. Resumable HTTP Range Requests
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-700)' }}>
                  Supporting <code>Range: bytes=X-Y</code> headers so interrupted downloads resume from exact drop point without corruption.
                </p>
              </div>
            </div>

            <button
              className="spectrum-Button spectrum-Button--accent"
              onClick={handleTestChunkedChecksum}
              disabled={isRunning}
              style={{ fontSize: '13px', marginBottom: '20px' }}
            >
              <ShieldCheck size={16} /> Run Chunked Stream & SHA-256 Checksum Test
            </button>
          </div>
        )}

        {/* Live Execution Output Console */}
        {executionResult && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: 'var(--spectrum-global-color-gray-50)',
            border: '1px solid var(--spectrum-global-color-gray-300)',
            borderRadius: 'var(--spectrum-border-radius)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: executionResult.success ? 'var(--spectrum-semantic-positive)' : 'var(--spectrum-semantic-negative)' }}>
                <CheckCircle2 size={16} />
                Execution Success ({executionResult.durationMs}ms)
              </div>
              <span className="spectrum-Tag spectrum-Tag--blue">
                SHA-256: {executionResult.calculatedSha256.substring(0, 12)}...
              </span>
            </div>

            <div style={{
              fontFamily: 'var(--spectrum-code-font)',
              fontSize: '11px',
              maxHeight: '160px',
              overflowY: 'auto',
              color: 'var(--spectrum-global-color-gray-900)',
              backgroundColor: 'var(--spectrum-global-color-gray-100)',
              padding: '10px',
              borderRadius: '4px'
            }}>
              {executionResult.logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '2px' }}>{log}</div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

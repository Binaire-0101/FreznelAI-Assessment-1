/**
 * MainLayout Component providing desktop & mobile structural shell.
 * Coordinates Dark Sidebar, Top Header, SearchBar, FilterPanel, and Modals.
 *
 * Binaire Freznel AI Assessment - Requirements #7, #8, #12, #14
 */

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SearchBar } from '../search/SearchBar';
import { FilterPanel } from '../filters/FilterPanel';
import { ModelList } from '../models/ModelList';
import { SelectionSummary } from '../models/SelectionSummary';
import { ModelDetailDialog } from '../models/ModelDetailDialog';
import { ModelCompareModal } from '../models/ModelCompareModal';
import { SettingsModal } from '../settings/SettingsModal';
import { SpecsView } from '../models/SpecsView';
import { ActiveSelectedView } from '../models/ActiveSelectedView';
import { Model } from '../../models/Model';

export const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'models' | 'selected' | 'settings' | 'specs'>('models');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Modals state
  const [detailModel, setDetailModel] = useState<Model | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleViewDetails = (model: Model) => {
    setDetailModel(model);
    setIsDetailOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailOpen(false);
    setDetailModel(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Dark Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        {/* Top Header */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenCompare={() => setIsCompareOpen(true)}
          onToggleMobileFilter={() => setMobileFilterOpen(true)}
        />

        {/* Selected Model Summary Banner */}
        <SelectionSummary onViewDetails={handleViewDetails} />

        {/* Main Body depending on current tab */}
        {currentTab === 'models' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <SearchBar />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Desktop Filter Panel */}
              <div style={{ display: 'none' }} className="md:block">
                <FilterPanel />
              </div>

              {/* Mobile Filter Modal */}
              {mobileFilterOpen && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    zIndex: 900,
                    display: 'flex',
                  }}
                  onClick={() => setMobileFilterOpen(false)}
                >
                  <div
                    style={{
                      width: '280px',
                      height: '100%',
                      backgroundColor: 'var(--bg-primary)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FilterPanel onCloseMobile={() => setMobileFilterOpen(false)} />
                  </div>
                </div>
              )}

              {/* Model Cards Grid */}
              <ModelList onViewDetails={handleViewDetails} />
            </div>
          </div>
        )}

        {currentTab === 'selected' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ActiveSelectedView
              onBrowseRegistry={() => setCurrentTab('models')}
              onViewDetails={handleViewDetails}
            />
          </div>
        )}

        {currentTab === 'specs' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SpecsView />
          </div>
        )}
      </div>

      {/* Modals & Dialogs */}
      <ModelDetailDialog
        model={detailModel}
        isOpen={isDetailOpen}
        onClose={handleCloseDetails}
      />

      <ModelCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onViewDetails={handleViewDetails}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

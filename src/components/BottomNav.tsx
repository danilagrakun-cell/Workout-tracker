import React from 'react';
import { Home, History, TrendingUp, MoreHorizontal, Plus } from 'lucide-react';

export type NavTab = 'home' | 'history' | 'progress' | 'more' | 'workout-edit' | 'workout-detail' | 'catalog';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onNewWorkout: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onNewWorkout
}) => {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      <button
        type="button"
        className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabChange('home')}
        aria-current={activeTab === 'home' ? 'page' : undefined}
      >
        <Home size={22} />
        <span className="nav-label">Главная</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onTabChange('history')}
        aria-current={activeTab === 'history' ? 'page' : undefined}
      >
        <History size={22} />
        <span className="nav-label">История</span>
      </button>

      {/* Floating Center Action Button for quick new workout */}
      <div className="nav-action-wrapper">
        <button
          type="button"
          className="nav-action-btn"
          onClick={onNewWorkout}
          aria-label="Новая тренировка"
          title="Начать новую тренировку"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

      <button
        type="button"
        className={`nav-item ${activeTab === 'progress' ? 'active' : ''}`}
        onClick={() => onTabChange('progress')}
        aria-current={activeTab === 'progress' ? 'page' : undefined}
      >
        <TrendingUp size={22} />
        <span className="nav-label">Прогресс</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === 'more' || activeTab === 'catalog' ? 'active' : ''}`}
        onClick={() => onTabChange('more')}
        aria-current={activeTab === 'more' ? 'page' : undefined}
      >
        <MoreHorizontal size={22} />
        <span className="nav-label">Ещё</span>
      </button>
    </nav>
  );
};

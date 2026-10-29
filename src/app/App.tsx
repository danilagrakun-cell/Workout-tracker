import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ToastProvider } from '../components/Toast';
import { Header } from '../components/Header';
import { BottomNav, NavTab } from '../components/BottomNav';
import { HomePage } from '../pages/HomePage';
import { WorkoutsHistoryPage } from '../pages/WorkoutsHistoryPage';
import { WorkoutDetailPage } from '../pages/WorkoutDetailPage';
import { WorkoutEditorPage } from '../pages/WorkoutEditorPage';
import { ProgressPage } from '../pages/ProgressPage';
import { CatalogPage } from '../pages/CatalogPage';
import { SettingsPage } from '../pages/SettingsPage';

export const AppContent: React.FC = () => {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();

  // Navigation state
  const [currentView, setCurrentView] = useState<NavTab>('home');
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);

  // Navigation handlers
  const handleNewWorkout = () => {
    setActiveWorkoutId(null);
    setCurrentView('workout-edit');
  };

  const handleEditWorkout = (workoutId: string) => {
    setActiveWorkoutId(workoutId);
    setCurrentView('workout-edit');
  };

  const handleViewWorkout = (workoutId: string) => {
    setActiveWorkoutId(workoutId);
    setCurrentView('workout-detail');
  };

  const handleSaveSuccess = (savedId: string) => {
    setActiveWorkoutId(savedId);
    setCurrentView('workout-detail');
  };

  const handleBackToHistory = () => {
    setCurrentView('history');
  };

  const getHeaderTitle = (): { title: string; subtitle?: string; showBack: boolean; onBack?: () => void } => {
    switch (currentView) {
      case 'home':
        return { title: 'Workout Diary', subtitle: 'Дневник тренировок', showBack: false };
      case 'history':
        return { title: 'История', subtitle: 'Все тренировки', showBack: false };
      case 'progress':
        return { title: 'Прогресс', subtitle: 'Аналитика и тоннаж', showBack: false };
      case 'more':
        return { title: 'Настройки', subtitle: 'Данные и PWA', showBack: false };
      case 'catalog':
        return {
          title: 'Каталог упражнений',
          showBack: true,
          onBack: () => setCurrentView('more')
        };
      case 'workout-detail':
        return {
          title: 'Просмотр тренировки',
          showBack: true,
          onBack: () => setCurrentView('history')
        };
      case 'workout-edit':
        return {
          title: activeWorkoutId ? 'Редактирование' : 'Новая тренировка',
          showBack: true,
          onBack: () => {
            if (activeWorkoutId) {
              setCurrentView('workout-detail');
            } else {
              setCurrentView('home');
            }
          }
        };
      default:
        return { title: 'Workout Diary', showBack: false };
    }
  };

  const headerConfig = getHeaderTitle();

  return (
    <div className="app-shell">
      {/* Header is shown on non-editor views to preserve screen space on editor */}
      {currentView !== 'workout-edit' && (
        <Header
          title={headerConfig.title}
          subtitle={headerConfig.subtitle}
          resolvedTheme={resolvedTheme}
          onToggleTheme={toggleTheme}
          showBack={headerConfig.showBack}
          onBack={headerConfig.onBack}
        />
      )}

      {/* Main Page Content */}
      <main className="main-content">
        {currentView === 'home' && (
          <HomePage
            onNewWorkout={handleNewWorkout}
            onViewWorkout={handleViewWorkout}
            onGoToHistory={() => setCurrentView('history')}
            onGoToProgress={() => setCurrentView('progress')}
          />
        )}

        {currentView === 'history' && (
          <WorkoutsHistoryPage
            onViewWorkout={handleViewWorkout}
            onEditWorkout={handleEditWorkout}
            onNewWorkout={handleNewWorkout}
            onDuplicateSuccess={(newId) => handleViewWorkout(newId)}
          />
        )}

        {currentView === 'progress' && <ProgressPage />}

        {currentView === 'more' && (
          <SettingsPage
            currentTheme={theme}
            onThemeChange={setTheme}
            onOpenCatalog={() => setCurrentView('catalog')}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogPage onBack={() => setCurrentView('more')} />
        )}

        {currentView === 'workout-detail' && activeWorkoutId && (
          <WorkoutDetailPage
            workoutId={activeWorkoutId}
            onBack={handleBackToHistory}
            onEdit={(id) => handleEditWorkout(id)}
            onDuplicateSuccess={(newId) => handleViewWorkout(newId)}
            onDeleteSuccess={() => setCurrentView('history')}
          />
        )}

        {currentView === 'workout-edit' && (
          <WorkoutEditorPage
            workoutId={activeWorkoutId || undefined}
            onSaveSuccess={handleSaveSuccess}
            onCancel={() => {
              if (activeWorkoutId) {
                setCurrentView('workout-detail');
              } else {
                setCurrentView('home');
              }
            }}
          />
        )}
      </main>

      {/* Bottom Navigation is hidden only during active full workout editing */}
      {currentView !== 'workout-edit' && (
        <BottomNav
          activeTab={currentView}
          onTabChange={(tab) => setCurrentView(tab)}
          onNewWorkout={handleNewWorkout}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

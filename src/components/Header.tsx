import React from 'react';
import { Dumbbell, Sun, Moon, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  resolvedTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Workout Diary',
  subtitle,
  resolvedTheme,
  onToggleTheme,
  showBack = false,
  onBack
}) => {
  const { isOnline } = useOnlineStatus();

  return (
    <header className="app-header">
      <div className="header-left">
        {showBack && onBack ? (
          <button
            type="button"
            className="icon-btn back-btn"
            onClick={onBack}
            aria-label="Назад"
          >
            ←
          </button>
        ) : (
          <div className="app-logo-badge" aria-hidden="true">
            <Dumbbell size={20} className="logo-icon" />
          </div>
        )}

        <div className="header-titles">
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="header-right">
        {!isOnline && (
          <div className="offline-badge" title="Работа без подключения к интернету">
            <WifiOff size={14} />
            <span className="offline-badge-text">Офлайн</span>
          </div>
        )}

        <button
          type="button"
          className="icon-btn theme-toggle-btn"
          onClick={onToggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          title={resolvedTheme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        >
          {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

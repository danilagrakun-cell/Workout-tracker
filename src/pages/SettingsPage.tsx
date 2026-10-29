import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  ShieldCheck,
  Smartphone,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  BookOpen,
  Info
} from 'lucide-react';
import { backupService } from '../features/backup/backupService';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ThemeMode, BackupData } from '../types';

interface SettingsPageProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onOpenCatalog: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentTheme,
  onThemeChange,
  onOpenCatalog
}) => {
  const { showToast } = useToast();
  const { isOnline, isPwaInstalled, isOfflineReady } = useOnlineStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingBackupData, setPendingBackupData] = useState<BackupData | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await backupService.exportToFile();
      showToast('Резервная копия успешно экспортирована!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Ошибка при экспорте резервной копии', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const validation = backupService.validateBackup(parsed);

        if (!validation.isValid || !validation.data) {
          showToast(validation.error || 'Некорректная структура файла', 'error');
          return;
        }

        setPendingBackupData(validation.data);
        setShowImportConfirm(true);
      } catch (err) {
        showToast('Не удалось прочитать JSON-файл. Проверьте целостность файла.', 'error');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      showToast('Ошибка чтения файла', 'error');
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!pendingBackupData) return;
    setIsImporting(true);
    try {
      await backupService.restoreBackup(pendingBackupData);
      showToast('Данные успешно восстановлены из резервной копии!', 'success');
      setShowImportConfirm(false);
      setPendingBackupData(null);
    } catch (err) {
      console.error(err);
      showToast('Ошибка при восстановлении базы данных', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="page-container settings-page">
      <div className="page-header-box mb-3">
        <h2 className="page-title">Настройки и данные</h2>
        <p className="page-subtitle">Управление темой, резервными копиями и параметрами PWA</p>
      </div>

      {/* Catalog Quick Link */}
      <div className="card mb-3">
        <div className="settings-link-row" onClick={onOpenCatalog} role="button" tabIndex={0}>
          <div className="flex-align gap-3">
            <div className="settings-icon-badge blue">
              <BookOpen size={20} />
            </div>
            <div>
              <h4 className="settings-item-title">Каталог упражнений</h4>
              <p className="settings-item-desc">Просмотр и создание собственных упражнений</p>
            </div>
          </div>
          <span className="text-muted">Открыть →</span>
        </div>
      </div>

      {/* Theme Settings Card */}
      <div className="card mb-3">
        <h3 className="section-title mb-2">Оформление интерфейса</h3>
        <p className="settings-item-desc mb-3">Выберите удобную цветовую тему для спортзала:</p>

        <div className="segmented-control theme-switcher">
          <button
            type="button"
            className={`segment-btn ${currentTheme === 'dark' ? 'active' : ''}`}
            onClick={() => onThemeChange('dark')}
          >
            <Moon size={16} />
            <span>Тёмная</span>
          </button>
          <button
            type="button"
            className={`segment-btn ${currentTheme === 'light' ? 'active' : ''}`}
            onClick={() => onThemeChange('light')}
          >
            <Sun size={16} />
            <span>Светлая</span>
          </button>
          <button
            type="button"
            className={`segment-btn ${currentTheme === 'system' ? 'active' : ''}`}
            onClick={() => onThemeChange('system')}
          >
            <Laptop size={16} />
            <span>Системная</span>
          </button>
        </div>
      </div>

      {/* Backup & Restore Card */}
      <div className="card mb-3">
        <div className="flex-align gap-2 mb-2">
          <ShieldCheck size={20} className="text-primary" />
          <h3 className="section-title">Резервное копирование (JSON)</h3>
        </div>
        <p className="settings-item-desc mb-3">
          Все ваши тренировки хранятся только локально в IndexedDB на этом устройстве. Регулярно сохраняйте резервную копию, чтобы не потерять историю при смене браузера или очистке кэша.
        </p>

        <div className="backup-actions-grid">
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download size={18} />
            <span>{isExporting ? 'Экспорт...' : 'Экспорт в JSON'}</span>
          </button>

          <button
            type="button"
            className="btn btn-outline btn-block"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload size={18} />
            <span>{isImporting ? 'Импорт...' : 'Импорт из JSON'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* PWA & Offline Status */}
      <div className="card mb-3">
        <div className="flex-align gap-2 mb-2">
          <Smartphone size={20} className="text-primary" />
          <h3 className="section-title">Офлайн-режим и PWA</h3>
        </div>

        <div className="status-indicators-list">
          <div className="status-row">
            <span className="status-label">Подключение к сети:</span>
            <div className="status-value flex-align gap-1">
              {isOnline ? (
                <>
                  <Wifi size={16} className="text-success" />
                  <span className="text-success bold">В сети</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} className="text-warning" />
                  <span className="text-warning bold">Офлайн (без сети)</span>
                </>
              )}
            </div>
          </div>

          <div className="status-row">
            <span className="status-label">Кэш оболочки приложения:</span>
            <div className="status-value flex-align gap-1">
              {isOfflineReady ? (
                <>
                  <CheckCircle2 size={16} className="text-success" />
                  <span className="text-success bold">Готово к работе офлайн</span>
                </>
              ) : (
                <>
                  <Info size={16} className="text-muted" />
                  <span className="text-muted">Кэшируется при установке</span>
                </>
              )}
            </div>
          </div>

          <div className="status-row">
            <span className="status-label">Режим запуска:</span>
            <div className="status-value">
              <span className="badge">
                {isPwaInstalled ? 'PWA (Установлено как приложение)' : 'Веб-браузер'}
              </span>
            </div>
          </div>
        </div>

        <div className="pwa-help-note mt-3">
          <Info size={16} className="info-icon" />
          <p className="help-text">
            Чтобы установить Workout Diary на смартфон: в Chrome/Яндекс Браузере нажмите «Установить на главный экран», в Safari на iOS — «Поделиться» → «На экран Домой».
          </p>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="card privacy-card">
        <h4 className="privacy-title">Конфиденциальность и безопасность</h4>
        <p className="privacy-text">
          Workout Diary не имеет серверной части, не содержит внешних систем аналитики и не передаёт ваши тренировки в интернет. Данные каждого пользователя изолированы и хранятся исключительно в памяти браузера.
        </p>
      </div>

      {/* Confirmation modal before replacing database */}
      <ConfirmDialog
        isOpen={showImportConfirm}
        title="Заменить текущие данные?"
        message={`В выбранной резервной копии найдено: ${pendingBackupData?.workouts.length ?? 0} тренировок, ${pendingBackupData?.exercises.length ?? 0} упражнений и ${pendingBackupData?.sets.length ?? 0} подходов. Внимание: все текущие записи в приложении будут полностью заменены.`}
        confirmLabel="Заменить и восстановить"
        cancelLabel="Отмена"
        variant="warning"
        onConfirm={handleConfirmImport}
        onCancel={() => {
          setShowImportConfirm(false);
          setPendingBackupData(null);
        }}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Copy,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { Workout, WorkoutType } from '../types';
import { workoutService, WorkoutFilter } from '../features/workouts/workoutService';
import {
  formatDate,
  getWorkoutTypeLabel,
  WORKOUT_TYPE_LABELS,
  getTodayDateString
} from '../utils/formatters';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

interface WorkoutsHistoryPageProps {
  onViewWorkout: (id: string) => void;
  onEditWorkout: (id: string) => void;
  onNewWorkout: () => void;
  onDuplicateSuccess: (newId: string) => void;
}

export const WorkoutsHistoryPage: React.FC<WorkoutsHistoryPageProps> = ({
  onViewWorkout,
  onEditWorkout,
  onNewWorkout,
  onDuplicateSuccess
}) => {
  const { showToast } = useToast();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month'>('all');
  const [typeFilter, setTypeFilter] = useState<WorkoutType | 'all'>('all');

  // Delete state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadWorkouts();
  }, [periodFilter, typeFilter]);

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      const filter: WorkoutFilter = {
        period: periodFilter,
        type: typeFilter
      };
      const list = await workoutService.getWorkouts(filter);
      setWorkouts(list);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await workoutService.deleteWorkout(deleteTargetId);
      showToast('Тренировка удалена', 'info');
      setDeleteTargetId(null);
      await loadWorkouts();
    } catch (err) {
      console.error(err);
      showToast('Ошибка при удалении', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const today = getTodayDateString();
      const duplicated = await workoutService.duplicateWorkout(id, today);
      if (duplicated) {
        showToast('Тренировка продублирована на сегодня', 'success');
        onDuplicateSuccess(duplicated.id);
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка при дублировании', 'error');
    }
  };

  return (
    <div className="page-container history-page">
      {/* Page Header */}
      <div className="section-header-flex mb-3">
        <div>
          <h2 className="page-title">История тренировок</h2>
          <p className="page-subtitle">Все сохранённые записи из памяти устройства</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onNewWorkout}
        >
          <Plus size={16} />
          <span>Новая</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="filters-card card">
        <div className="filter-group">
          <span className="filter-label">Период:</span>
          <div className="filter-pills-row">
            <button
              type="button"
              className={`pill-btn sm ${periodFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPeriodFilter('all')}
            >
              Все
            </button>
            <button
              type="button"
              className={`pill-btn sm ${periodFilter === 'week' ? 'active' : ''}`}
              onClick={() => setPeriodFilter('week')}
            >
              Эта неделя
            </button>
            <button
              type="button"
              className={`pill-btn sm ${periodFilter === 'month' ? 'active' : ''}`}
              onClick={() => setPeriodFilter('month')}
            >
              Этот месяц
            </button>
          </div>
        </div>

        <div className="filter-group mt-2">
          <span className="filter-label">Тип нагрузки:</span>
          <div className="filter-pills-row">
            <button
              type="button"
              className={`pill-btn sm ${typeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              Все типы
            </button>
            {Object.entries(WORKOUT_TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`pill-btn sm ${typeFilter === key ? 'active' : ''}`}
                onClick={() => setTypeFilter(key as WorkoutType)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workouts List */}
      <div className="history-list-section">
        {loading ? (
          <div className="loading-state">Загрузка истории тренировок...</div>
        ) : workouts.length === 0 ? (
          <div className="card empty-history-card">
            <Inbox size={40} className="empty-icon" />
            <h4 className="empty-title">Записей не найдено</h4>
            <p className="empty-desc">
              {periodFilter !== 'all' || typeFilter !== 'all'
                ? 'Нет тренировок, соответствующих выбранным фильтрам.'
                : 'Вы ещё не сохранили ни одной тренировки в дневник.'}
            </p>
            {periodFilter !== 'all' || typeFilter !== 'all' ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setPeriodFilter('all');
                  setTypeFilter('all');
                }}
              >
                Сбросить фильтры
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onNewWorkout}
              >
                <Plus size={16} />
                <span>Записать тренировку</span>
              </button>
            )}
          </div>
        ) : (
          <div className="history-items-container">
            {workouts.map((w) => (
              <div
                key={w.id}
                className="card history-item-card"
                onClick={() => onViewWorkout(w.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onViewWorkout(w.id);
                }}
              >
                <div className="history-card-top">
                  <div className="history-card-titles">
                    <div className="history-badges-row">
                      <span className={`workout-type-pill ${w.type}`}>
                        {getWorkoutTypeLabel(w.type)}
                      </span>
                      <span className="history-item-date">
                        <Calendar size={13} />
                        {formatDate(w.date)}
                      </span>
                    </div>
                    <h3 className="history-item-title">{w.title}</h3>
                  </div>

                  <ChevronRight size={20} className="history-arrow-icon" />
                </div>

                {w.notes && (
                  <p className="history-item-notes-snippet">{w.notes}</p>
                )}

                <div className="history-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="history-action-btn"
                    onClick={(e) => handleDuplicate(e, w.id)}
                    title="Повторить эту тренировку"
                  >
                    <Copy size={15} />
                    <span>Повторить</span>
                  </button>

                  <button
                    type="button"
                    className="history-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditWorkout(w.id);
                    }}
                    title="Редактировать тренировку"
                  >
                    <Edit2 size={15} />
                    <span>Изменить</span>
                  </button>

                  <button
                    type="button"
                    className="history-action-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetId(w.id);
                    }}
                    title="Удалить тренировку"
                  >
                    <Trash2 size={15} />
                    <span>Удалить</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Удалить тренировку?"
        message="Вы уверены, что хотите удалить выбранную тренировку? Это действие необратимо."
        confirmLabel={isDeleting ? 'Удаление...' : 'Удалить'}
        cancelLabel="Отмена"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  FileText,
  Edit2,
  Trash2,
  Copy,
  ArrowLeft
} from 'lucide-react';
import { WorkoutWithDetails } from '../types';
import { workoutService } from '../features/workouts/workoutService';
import {
  formatDate,
  getWorkoutTypeLabel,
  getCategoryLabel,
  formatDuration,
  formatDistance,
  getTodayDateString
} from '../utils/formatters';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { calculateExercisesVolume } from '../features/progress/progressService';

interface WorkoutDetailPageProps {
  workoutId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
  onDuplicateSuccess: (newWorkoutId: string) => void;
  onDeleteSuccess: () => void;
}

export const WorkoutDetailPage: React.FC<WorkoutDetailPageProps> = ({
  workoutId,
  onBack,
  onEdit,
  onDuplicateSuccess,
  onDeleteSuccess
}) => {
  const { showToast } = useToast();
  const [workout, setWorkout] = useState<WorkoutWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  const loadWorkout = async () => {
    setLoading(true);
    try {
      const data = await workoutService.getWorkoutWithDetails(workoutId);
      setWorkout(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await workoutService.deleteWorkout(workoutId);
      showToast('Тренировка удалена', 'info');
      onDeleteSuccess();
    } catch (err) {
      console.error(err);
      showToast('Ошибка при удалении', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const today = getTodayDateString();
      const duplicated = await workoutService.duplicateWorkout(workoutId, today);
      if (duplicated) {
        showToast('Структура тренировки скопирована на сегодня', 'success');
        onDuplicateSuccess(duplicated.id);
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка при копировании тренировки', 'error');
    } finally {
      setIsDuplicating(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Загрузка данных тренировки...</div>;
  }

  if (!workout) {
    return (
      <div className="empty-state-container">
        <p>Тренировка не найдена или была удалена</p>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Вернуться назад
        </button>
      </div>
    );
  }

  const totalVolume = calculateExercisesVolume(workout.exercises);
  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  return (
    <div className="page-container workout-detail-page">
      {/* Top Bar */}
      <div className="detail-top-nav">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          <span>Назад</span>
        </button>

        <div className="detail-top-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleDuplicate}
            disabled={isDuplicating}
            title="Повторить эту тренировку на сегодня с новыми идентификаторами"
          >
            <Copy size={16} />
            <span>{isDuplicating ? 'Копирование...' : 'Повторить'}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onEdit(workout.id)}
          >
            <Edit2 size={16} />
            <span>Изменить</span>
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="card workout-detail-hero">
        <div className="detail-hero-header">
          <div className="detail-hero-badge">
            <span className={`workout-type-pill ${workout.type}`}>
              {getWorkoutTypeLabel(workout.type)}
            </span>
            <span className="detail-date-badge">
              <Calendar size={14} />
              {formatDate(workout.date)} ({workout.date})
            </span>
          </div>
        </div>

        <h2 className="detail-title">{workout.title}</h2>

        {/* Quick summary stats */}
        <div className="detail-stats-grid">
          <div className="detail-stat-item">
            <span className="stat-label">Упражнений</span>
            <span className="stat-val">{workout.exercises.length}</span>
          </div>
          <div className="detail-stat-item">
            <span className="stat-label">Всего подходов</span>
            <span className="stat-val">{totalSets}</span>
          </div>
          {totalVolume > 0 && (
            <div className="detail-stat-item">
              <span className="stat-label">Тоннаж</span>
              <span className="stat-val highlight">{totalVolume} кг</span>
            </div>
          )}
        </div>

        {workout.notes && (
          <div className="detail-notes-box">
            <FileText size={16} className="notes-icon" />
            <p className="detail-notes-text">{workout.notes}</p>
          </div>
        )}
      </div>

      {/* Exercises List */}
      <div className="detail-exercises-section">
        <h3 className="section-title">
          Упражнения и подходы
        </h3>

        {workout.exercises.length === 0 ? (
          <div className="card empty-card">
            <p className="empty-text">В этой тренировке не было добавлено упражнений</p>
          </div>
        ) : (
          <div className="detail-exercise-cards">
            {workout.exercises.map((ex, exIdx) => {
              const exVolume = calculateExercisesVolume([ex]);
              return (
                <div key={ex.id} className="card detail-exercise-card">
                  <div className="detail-exercise-header">
                    <div className="detail-exercise-title-row">
                      <span className="exercise-number-badge">{exIdx + 1}</span>
                      <div>
                        <h4 className="detail-ex-name">{ex.name}</h4>
                        <div className="detail-ex-meta">
                          <span className="meta-tag">{getCategoryLabel(ex.category)}</span>
                          {exVolume > 0 && (
                            <span className="meta-tag volume-tag">{exVolume} кг</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {ex.notes && (
                    <div className="detail-ex-notes">
                      <p>Заметка: {ex.notes}</p>
                    </div>
                  )}

                  <div className="detail-sets-table">
                    <div className="detail-sets-row table-head">
                      <span className="col-idx">Сет</span>
                      <span className="col-val">Нагрузка</span>
                      <span className="col-notes">Заметка</span>
                    </div>

                    {ex.sets.map((set, sIdx) => {
                      let loadText = '';
                      if (set.weightKg != null && set.reps != null) {
                        loadText = `${set.weightKg} кг × ${set.reps} повт.`;
                      } else if (set.weightKg != null) {
                        loadText = `${set.weightKg} кг`;
                      } else if (set.reps != null) {
                        loadText = `${set.reps} повт.`;
                      } else if (set.durationSeconds != null && set.distanceMeters != null) {
                        loadText = `${formatDuration(set.durationSeconds)}, ${formatDistance(set.distanceMeters)}`;
                      } else if (set.durationSeconds != null) {
                        loadText = `${formatDuration(set.durationSeconds)}`;
                      } else if (set.distanceMeters != null) {
                        loadText = `${formatDistance(set.distanceMeters)}`;
                      } else {
                        loadText = 'Выполнен';
                      }

                      return (
                        <div key={set.id} className="detail-sets-row">
                          <span className="col-idx">{sIdx + 1}</span>
                          <span className="col-val bold">{loadText}</span>
                          <span className="col-notes">{set.notes || '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Danger Zone: Delete Workout */}
      <div className="danger-zone-wrapper">
        <button
          type="button"
          className="btn btn-outline-danger btn-block"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        >
          <Trash2 size={16} />
          <span>Удалить эту тренировку</span>
        </button>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Удалить тренировку?"
        message="Вы уверены, что хотите удалить эту тренировку? Все связанные упражнения и подходы будут удалены безвозвратно."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  Plus,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import {
  Workout,
  WorkoutType,
  WorkoutExercise,
  WorkoutSet,
  ExerciseCatalogItem,
  ExerciseType
} from '../types';
import { ExerciseItem } from '../features/workouts/ExerciseItem';
import { ExerciseSelectorModal } from '../features/exercises/ExerciseSelectorModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { workoutService } from '../features/workouts/workoutService';
import { generateId } from '../utils/id';
import { getTodayDateString, WORKOUT_TYPE_LABELS } from '../utils/formatters';
import { useToast } from '../components/Toast';

interface ExerciseDraft {
  exercise: WorkoutExercise;
  sets: WorkoutSet[];
  exerciseType?: ExerciseType;
}

interface WorkoutEditorPageProps {
  workoutId?: string; // If provided, edit mode
  onSaveSuccess: (savedWorkoutId: string) => void;
  onCancel: () => void;
}

export const WorkoutEditorPage: React.FC<WorkoutEditorPageProps> = ({
  workoutId,
  onSaveSuccess,
  onCancel
}) => {
  const { showToast } = useToast();

  const [date, setDate] = useState<string>(getTodayDateString());
  const [type, setType] = useState<WorkoutType>('strength');
  const [title, setTitle] = useState<string>('Силовая тренировка');
  const [notes, setNotes] = useState<string>('');
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(Boolean(workoutId));

  // Change tracking for unsaved warning
  const [initialJson, setInitialJson] = useState<string>('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Load existing workout if in edit mode
  useEffect(() => {
    if (!workoutId) {
      const initial = JSON.stringify({
        date: getTodayDateString(),
        type: 'strength',
        title: 'Силовая тренировка',
        notes: '',
        exercises: []
      });
      setInitialJson(initial);
      return;
    }

    const loadWorkout = async () => {
      try {
        const existing = await workoutService.getWorkoutWithDetails(workoutId);
        if (existing) {
          setDate(existing.date);
          setType(existing.type);
          setTitle(existing.title);
          setNotes(existing.notes || '');

          const drafts: ExerciseDraft[] = existing.exercises.map((ex) => ({
            exercise: {
              id: ex.id,
              workoutId: ex.workoutId,
              name: ex.name,
              category: ex.category,
              position: ex.position,
              notes: ex.notes
            },
            sets: ex.sets.map((s) => ({ ...s })),
            exerciseType: ex.category === 'cardio' ? 'cardio' : 'strength'
          }));

          setExercises(drafts);
          setInitialJson(
            JSON.stringify({
              date: existing.date,
              type: existing.type,
              title: existing.title,
              notes: existing.notes || '',
              exercises: drafts
            })
          );
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadWorkout();
  }, [workoutId]);

  // Check dirty state
  const isDirty = useMemo(() => {
    if (isInitialLoading) return false;
    const current = JSON.stringify({
      date,
      type,
      title,
      notes,
      exercises
    });
    return current !== initialJson;
  }, [date, type, title, notes, exercises, initialJson, isInitialLoading]);

  // Auto-update default title when type changes and user hasn't typed custom title
  const handleTypeChange = (newType: WorkoutType) => {
    setType(newType);
    if (!workoutId && (title === 'Силовая тренировка' || title === 'Кардио тренировка' || title === 'Смешанная тренировка')) {
      if (newType === 'strength') setTitle('Силовая тренировка');
      else if (newType === 'cardio') setTitle('Кардио тренировка');
      else setTitle('Смешанная тренировка');
    }
  };

  const handleSelectExercise = (item: ExerciseCatalogItem) => {
    const newExId = generateId();
    const newDraft: ExerciseDraft = {
      exercise: {
        id: newExId,
        workoutId: workoutId || '',
        name: item.name,
        category: item.category,
        position: exercises.length + 1,
        notes: ''
      },
      sets: [
        {
          id: generateId(),
          exerciseId: newExId,
          position: 1,
          weightKg: item.exerciseType === 'strength' ? 20 : null,
          reps: item.exerciseType === 'strength' ? 10 : null,
          durationSeconds: item.exerciseType === 'duration' ? 60 : item.exerciseType === 'cardio' ? 1200 : null,
          distanceMeters: item.exerciseType === 'cardio' ? 2000 : null
        }
      ],
      exerciseType: item.exerciseType
    };

    setExercises([...exercises, newDraft]);
  };

  const handleMoveExercise = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= exercises.length) return;
    const reordered = [...exercises];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setExercises(reordered);
  };

  const handleDeleteExercise = (index: number) => {
    const updated = exercises.filter((_, idx) => idx !== index);
    setExercises(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Введите название тренировки', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const targetId = workoutId || generateId();
      const now = Date.now();

      const workoutRecord: Workout = {
        id: targetId,
        date: date || getTodayDateString(),
        type,
        title: title.trim(),
        notes: notes.trim() || undefined,
        createdAt: now,
        updatedAt: now
      };

      const exercisesPayload = exercises.map((item, idx) => ({
        exercise: {
          ...item.exercise,
          id: item.exercise.id || generateId(),
          workoutId: targetId,
          position: idx + 1
        },
        sets: item.sets.map((s, sIdx) => ({
          ...s,
          id: s.id || generateId(),
          exerciseId: item.exercise.id,
          position: sIdx + 1,
          // Guarantee numbers are valid non-negative
          weightKg: s.weightKg != null && s.weightKg >= 0 ? s.weightKg : null,
          reps: s.reps != null && s.reps >= 0 ? Math.floor(s.reps) : null,
          durationSeconds: s.durationSeconds != null && s.durationSeconds >= 0 ? Math.floor(s.durationSeconds) : null,
          distanceMeters: s.distanceMeters != null && s.distanceMeters >= 0 ? s.distanceMeters : null
        }))
      }));

      await workoutService.saveWorkout(workoutRecord, exercisesPayload);
      showToast('Тренировка успешно сохранена!', 'success');
      onSaveSuccess(targetId);
    } catch (err) {
      console.error('Failed to save workout:', err);
      showToast('Ошибка при сохранении тренировки', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onCancel();
    }
  };

  if (isInitialLoading) {
    return <div className="loading-container">Загрузка тренировки...</div>;
  }

  return (
    <div className="page-container workout-editor-page">
      <form onSubmit={handleSave} className="workout-form">
        {/* Top Action Bar */}
        <div className="editor-top-bar">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCancelClick}
          >
            Отмена
          </button>
          <span className="editor-header-title">
            {workoutId ? 'Редактирование' : 'Новая тренировка'}
          </span>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isSaving}
          >
            <Save size={16} />
            <span>{isSaving ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
        </div>

        {/* Primary Workout Info Card */}
        <div className="card form-card">
          <div className="form-group">
            <label htmlFor="workout-title" className="form-label">
              Название тренировки
            </label>
            <input
              id="workout-title"
              type="text"
              className="input-field main-title-input"
              placeholder="Название (напр. Грудь и Трицепс)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="workout-date" className="form-label flex-align">
                <Calendar size={14} />
                <span>Дата</span>
              </label>
              <input
                id="workout-date"
                type="date"
                className="input-field date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="workout-type" className="form-label flex-align">
                <Layers size={14} />
                <span>Тип</span>
              </label>
              <select
                id="workout-type"
                className="select-field"
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as WorkoutType)}
              >
                {Object.entries(WORKOUT_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="workout-notes" className="form-label flex-align">
              <FileText size={14} />
              <span>Заметки о самочувствии / план</span>
            </label>
            <textarea
              id="workout-notes"
              className="textarea-field"
              rows={2}
              placeholder="Как прошла тренировка, отдых между подходами..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Exercises Section */}
        <div className="exercises-section">
          <div className="section-header-flex">
            <h3 className="section-title">
              Упражнения ({exercises.length})
            </h3>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsSelectorOpen(true)}
            >
              <Plus size={16} />
              <span>Добавить упражнение</span>
            </button>
          </div>

          {exercises.length === 0 ? (
            <div className="empty-exercises-card" onClick={() => setIsSelectorOpen(true)}>
              <div className="empty-plus-icon">
                <Plus size={28} />
              </div>
              <p className="empty-text bold">В тренировке ещё нет упражнений</p>
              <p className="empty-subtext">Нажмите, чтобы выбрать упражнение из каталога</p>
            </div>
          ) : (
            <div className="exercise-cards-list">
              {exercises.map((draft, idx) => (
                <ExerciseItem
                  key={draft.exercise.id || idx}
                  exercise={draft.exercise}
                  sets={draft.sets}
                  index={idx}
                  totalExercises={exercises.length}
                  exerciseType={draft.exerciseType || 'strength'}
                  onUpdateExercise={(updatedEx) => {
                    const copy = [...exercises];
                    copy[idx].exercise = updatedEx;
                    setExercises(copy);
                  }}
                  onUpdateSets={(updatedSets) => {
                    const copy = [...exercises];
                    copy[idx].sets = updatedSets;
                    setExercises(copy);
                  }}
                  onMoveUp={() => handleMoveExercise(idx, idx - 1)}
                  onMoveDown={() => handleMoveExercise(idx, idx + 1)}
                  onDeleteExercise={() => handleDeleteExercise(idx)}
                />
              ))}
            </div>
          )}

          {exercises.length > 0 && (
            <div className="add-more-exercise-btn-container">
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => setIsSelectorOpen(true)}
              >
                <Plus size={18} />
                <span>Добавить ещё упражнение</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Save Bar */}
        <div className="editor-bottom-save">
          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={isSaving}
          >
            <Save size={20} />
            <span>{isSaving ? 'Сохранение...' : 'Завершить и сохранить'}</span>
          </button>
        </div>
      </form>

      {/* Catalog Selector Modal */}
      <ExerciseSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelectExercise={handleSelectExercise}
      />

      {/* Confirmation when leaving dirty form */}
      <ConfirmDialog
        isOpen={showExitConfirm}
        title="Несохранённые изменения"
        message="Вы уверены, что хотите выйти? Все несохранённые изменения в тренировке будут утеряны."
        confirmLabel="Выйти без сохранения"
        cancelLabel="Остаться"
        variant="warning"
        onConfirm={() => {
          setShowExitConfirm(false);
          onCancel();
        }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
};

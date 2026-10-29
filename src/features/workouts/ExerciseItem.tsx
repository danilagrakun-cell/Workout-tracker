import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Copy,
  StickyNote
} from 'lucide-react';
import { WorkoutExercise, WorkoutSet, ExerciseType } from '../../types';
import { SetRow } from './SetRow';
import { generateId } from '../../utils/id';
import { getCategoryLabel } from '../../utils/formatters';

interface ExerciseItemProps {
  exercise: WorkoutExercise;
  sets: WorkoutSet[];
  index: number;
  totalExercises: number;
  exerciseType?: ExerciseType;
  onUpdateExercise: (exercise: WorkoutExercise) => void;
  onUpdateSets: (sets: WorkoutSet[]) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDeleteExercise: () => void;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  sets,
  index,
  totalExercises,
  exerciseType = 'strength',
  onUpdateExercise,
  onUpdateSets,
  onMoveUp,
  onMoveDown,
  onDeleteExercise
}) => {
  const [showNotes, setShowNotes] = useState(Boolean(exercise.notes));

  const handleAddSet = () => {
    // If there is already a previous set, copy its values as convenient default!
    const lastSet = sets[sets.length - 1];
    const newSet: WorkoutSet = {
      id: generateId(),
      exerciseId: exercise.id,
      position: sets.length + 1,
      weightKg: lastSet ? lastSet.weightKg : null,
      reps: lastSet ? lastSet.reps : null,
      durationSeconds: lastSet ? lastSet.durationSeconds : null,
      distanceMeters: lastSet ? lastSet.distanceMeters : null
    };
    onUpdateSets([...sets, newSet]);
  };

  const handleCopySet = (setIndex: number) => {
    const targetSet = sets[setIndex];
    if (!targetSet) return;

    const cloned: WorkoutSet = {
      id: generateId(),
      exerciseId: exercise.id,
      position: setIndex + 2,
      weightKg: targetSet.weightKg,
      reps: targetSet.reps,
      durationSeconds: targetSet.durationSeconds,
      distanceMeters: targetSet.distanceMeters,
      notes: targetSet.notes
    };

    const newSets = [...sets];
    newSets.splice(setIndex + 1, 0, cloned);
    onUpdateSets(newSets.map((s, idx) => ({ ...s, position: idx + 1 })));
  };

  const handleDeleteSet = (setIndex: number) => {
    const updated = sets
      .filter((_, idx) => idx !== setIndex)
      .map((s, idx) => ({ ...s, position: idx + 1 }));
    onUpdateSets(updated);
  };

  const handleSetChange = (setIndex: number, updatedSet: WorkoutSet) => {
    const updated = [...sets];
    updated[setIndex] = updatedSet;
    onUpdateSets(updated);
  };

  // Calculate volume for this exercise
  let exerciseVolume = 0;
  for (const s of sets) {
    if (s.weightKg && s.weightKg > 0 && s.reps && s.reps > 0) {
      exerciseVolume += s.weightKg * s.reps;
    }
  }

  return (
    <div className="exercise-card">
      <div className="exercise-card-header">
        <div className="exercise-header-title-box">
          <span className="exercise-number-badge">{index + 1}</span>
          <div className="exercise-title-meta">
            <h4 className="exercise-title">{exercise.name}</h4>
            <div className="exercise-meta-tags">
              <span className="meta-tag">{getCategoryLabel(exercise.category)}</span>
              {exerciseVolume > 0 && (
                <span className="meta-tag volume-tag" title="Суммарный тоннаж упражнения">
                  {Math.round(exerciseVolume)} кг
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="exercise-header-controls">
          <button
            type="button"
            className="icon-btn-sm"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Переместить выше"
            aria-label="Переместить выше"
          >
            <ChevronUp size={18} />
          </button>
          <button
            type="button"
            className="icon-btn-sm"
            onClick={onMoveDown}
            disabled={index === totalExercises - 1}
            title="Переместить ниже"
            aria-label="Переместить ниже"
          >
            <ChevronDown size={18} />
          </button>
          <button
            type="button"
            className="icon-btn-sm danger"
            onClick={onDeleteExercise}
            title="Удалить упражнение"
            aria-label={`Удалить ${exercise.name}`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Exercise notes */}
      {showNotes ? (
        <div className="exercise-note-wrapper">
          <input
            type="text"
            className="exercise-notes-input"
            placeholder="Заметка к упражнению (напр. хват шире плеч)..."
            value={exercise.notes ?? ''}
            onChange={(e) => onUpdateExercise({ ...exercise, notes: e.target.value })}
          />
        </div>
      ) : (
        <button
          type="button"
          className="add-exercise-note-link"
          onClick={() => setShowNotes(true)}
        >
          <StickyNote size={14} />
          <span>Добавить заметку к упражнению</span>
        </button>
      )}

      {/* Sets list */}
      <div className="sets-list-container">
        {sets.length > 0 && (
          <div className="sets-header-row">
            <span className="col-set">№</span>
            {exerciseType === 'strength' && (
              <>
                <span className="col-val">Вес</span>
                <span className="col-val">Повт.</span>
              </>
            )}
            {exerciseType === 'duration' && <span className="col-val full">Время</span>}
            {exerciseType === 'cardio' && (
              <>
                <span className="col-val">Время</span>
                <span className="col-val">Дистанция</span>
              </>
            )}
            <span className="col-actions">Действия</span>
          </div>
        )}

        {sets.map((set, setIdx) => (
          <SetRow
            key={set.id}
            set={set}
            index={setIdx}
            exerciseType={exerciseType}
            onChange={(updated) => handleSetChange(setIdx, updated)}
            onDelete={() => handleDeleteSet(setIdx)}
            onCopy={() => handleCopySet(setIdx)}
            canCopy={true}
          />
        ))}

        {sets.length === 0 && (
          <div className="no-sets-placeholder">
            <span>Нет подходов. Нажмите «+ Подход»</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="exercise-card-footer">
        <button
          type="button"
          className="btn btn-secondary btn-sm flex-1"
          onClick={handleAddSet}
        >
          <Plus size={16} />
          <span>Подход</span>
        </button>

        {sets.length > 0 && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleCopySet(sets.length - 1)}
            title="Дублировать последний подход"
          >
            <Copy size={16} />
            <span>Копировать последний</span>
          </button>
        )}
      </div>
    </div>
  );
};

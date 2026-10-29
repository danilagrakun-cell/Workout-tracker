import React from 'react';
import { Trash2, Copy, StickyNote } from 'lucide-react';
import { WorkoutSet, ExerciseType } from '../../types';

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  exerciseType: ExerciseType;
  onChange: (updated: WorkoutSet) => void;
  onDelete: () => void;
  onCopy: () => void;
  canCopy: boolean;
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  index,
  exerciseType,
  onChange,
  onDelete,
  onCopy,
  canCopy
}) => {
  const [showNote, setShowNote] = React.useState(Boolean(set.notes));

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ ...set, weightKg: null });
      return;
    }
    const parsed = parseFloat(val.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      onChange({ ...set, weightKg: parsed });
    }
  };

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ ...set, reps: null });
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange({ ...set, reps: parsed });
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ ...set, durationSeconds: null });
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      // Input in seconds (or minutes depending on field)
      onChange({ ...set, durationSeconds: parsed });
    }
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ ...set, distanceMeters: null });
      return;
    }
    const parsed = parseFloat(val.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      onChange({ ...set, distanceMeters: parsed });
    }
  };

  return (
    <div className="set-row">
      <div className="set-index" title={`Подход ${index + 1}`}>
        {index + 1}
      </div>

      <div className="set-inputs">
        {exerciseType === 'strength' && (
          <>
            <div className="input-with-label">
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                className="set-input"
                placeholder="0"
                value={set.weightKg ?? ''}
                onChange={handleWeightChange}
                aria-label={`Вес для подхода ${index + 1}`}
              />
              <span className="input-unit">кг</span>
            </div>

            <div className="input-with-label">
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                className="set-input"
                placeholder="0"
                value={set.reps ?? ''}
                onChange={handleRepsChange}
                aria-label={`Повторения для подхода ${index + 1}`}
              />
              <span className="input-unit">повт.</span>
            </div>
          </>
        )}

        {exerciseType === 'duration' && (
          <div className="input-with-label full-width">
            <input
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              className="set-input"
              placeholder="0"
              value={set.durationSeconds ?? ''}
              onChange={handleDurationChange}
              aria-label={`Секунды для подхода ${index + 1}`}
            />
            <span className="input-unit">сек.</span>
          </div>
        )}

        {exerciseType === 'cardio' && (
          <>
            <div className="input-with-label">
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                className="set-input"
                placeholder="0"
                value={set.durationSeconds ? Math.round(set.durationSeconds / 60) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const mins = val === '' ? null : parseInt(val, 10);
                  onChange({
                    ...set,
                    durationSeconds: mins !== null && !isNaN(mins) && mins >= 0 ? mins * 60 : null
                  });
                }}
                aria-label={`Минуты для подхода ${index + 1}`}
              />
              <span className="input-unit">мин</span>
            </div>

            <div className="input-with-label">
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                className="set-input"
                placeholder="0"
                value={set.distanceMeters ?? ''}
                onChange={handleDistanceChange}
                aria-label={`Дистанция в метрах для подхода ${index + 1}`}
              />
              <span className="input-unit">м</span>
            </div>
          </>
        )}
      </div>

      <div className="set-actions">
        {canCopy && (
          <button
            type="button"
            className="set-action-btn"
            onClick={onCopy}
            title="Копировать этот подход"
            aria-label="Копировать подход"
          >
            <Copy size={16} />
          </button>
        )}

        <button
          type="button"
          className={`set-action-btn ${showNote ? 'active' : ''}`}
          onClick={() => setShowNote(!showNote)}
          title="Заметка к подходу"
          aria-label="Заметка к подходу"
        >
          <StickyNote size={16} />
        </button>

        <button
          type="button"
          className="set-action-btn delete"
          onClick={onDelete}
          title="Удалить подход"
          aria-label={`Удалить подход ${index + 1}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {showNote && (
        <div className="set-note-row">
          <input
            type="text"
            className="set-note-input"
            placeholder="Заметка к подходу (напр. тяжело в конце)..."
            value={set.notes ?? ''}
            onChange={(e) => onChange({ ...set, notes: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};

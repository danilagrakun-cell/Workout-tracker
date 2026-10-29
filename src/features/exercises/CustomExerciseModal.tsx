import React, { useState } from 'react';
import { X, Plus, Dumbbell } from 'lucide-react';
import { ExerciseCategory, EquipmentType, ExerciseType, ExerciseCatalogItem } from '../../types';
import { CATEGORY_LABELS, EQUIPMENT_LABELS } from '../../utils/formatters';

interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: Omit<ExerciseCatalogItem, 'id' | 'isCustom'>) => void;
}

export const CustomExerciseModal: React.FC<CustomExerciseModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('chest');
  const [equipment, setEquipment] = useState<EquipmentType>('barbell');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('strength');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Введите название упражнения');
      return;
    }

    onSave({
      name: trimmed,
      category,
      equipment,
      exerciseType
    });

    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="custom-ex-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-icon">
            <Dumbbell size={20} />
          </div>
          <h3 id="custom-ex-title" className="modal-title">Новое упражнение</h3>
          <button type="button" className="modal-close-icon" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="custom-exercise-form">
          <div className="form-group">
            <label htmlFor="custom-name" className="form-label">
              Название упражнения <span className="req">*</span>
            </label>
            <input
              id="custom-name"
              type="text"
              className={`input-field ${error ? 'input-error' : ''}`}
              placeholder="Например: Жим гантелей под углом"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              autoFocus
            />
            {error && <p className="field-error-text">{error}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="custom-category" className="form-label">Группа мышц / категория</label>
            <select
              id="custom-category"
              className="select-field"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="custom-equipment" className="form-label">Инвентарь</label>
            <select
              id="custom-equipment"
              className="select-field"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value as EquipmentType)}
            >
              {Object.entries(EQUIPMENT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Тип нагрузки</label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segment-btn ${exerciseType === 'strength' ? 'active' : ''}`}
                onClick={() => setExerciseType('strength')}
              >
                Силовое (вес/повт.)
              </button>
              <button
                type="button"
                className={`segment-btn ${exerciseType === 'duration' ? 'active' : ''}`}
                onClick={() => setExerciseType('duration')}
              >
                Время (планка/статика)
              </button>
              <button
                type="button"
                className={`segment-btn ${exerciseType === 'cardio' ? 'active' : ''}`}
                onClick={() => setExerciseType('cardio')}
              >
                Кардио (время/дист.)
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={18} />
              <span>Создать</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

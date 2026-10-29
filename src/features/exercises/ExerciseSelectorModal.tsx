import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, X, Dumbbell, Sparkles } from 'lucide-react';
import { ExerciseCatalogItem } from '../../types';
import { catalogService } from './catalogService';
import { CATEGORY_LABELS, getEquipmentLabel } from '../../utils/formatters';
import { CustomExerciseModal } from './CustomExerciseModal';

interface ExerciseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseCatalogItem) => void;
}

export const ExerciseSelectorModal: React.FC<ExerciseSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectExercise
}) => {
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
    }
  }, [isOpen]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const items = await catalogService.getAll();
      setExercises(items);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return exercises.filter((item) => {
      const matchesSearch = !q || item.name.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchQuery, selectedCategory]);

  const handleCreateCustom = async (itemData: Omit<ExerciseCatalogItem, 'id' | 'isCustom'>) => {
    const newItem = await catalogService.addCustom(itemData);
    await loadCatalog();
    onSelectExercise(newItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="selector-title">
        <div className="modal-card full-mobile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 id="selector-title" className="modal-title">Выбор упражнения</h3>
            <button type="button" className="modal-close-icon" onClick={onClose} aria-label="Закрыть">
              <X size={22} />
            </button>
          </div>

          {/* Search bar */}
          <div className="search-bar-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Очистить поиск"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="category-pills-scroll">
            <button
              type="button"
              className={`pill-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Все
            </button>
            {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
              <button
                key={catKey}
                type="button"
                className={`pill-btn ${selectedCategory === catKey ? 'active' : ''}`}
                onClick={() => setSelectedCategory(catKey)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Action button to add custom */}
          <div className="selector-custom-bar">
            <button
              type="button"
              className="btn btn-outline btn-sm btn-block"
              onClick={() => setIsCustomModalOpen(true)}
            >
              <Plus size={16} />
              <span>Создать своё упражнение</span>
            </button>
          </div>

          {/* Exercise list */}
          <div className="exercise-list-scroll">
            {loading ? (
              <div className="loading-state">Загрузка упражнений...</div>
            ) : filteredExercises.length === 0 ? (
              <div className="empty-catalog-state">
                <Dumbbell size={36} className="empty-icon" />
                <p className="empty-text">Ничего не найдено</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsCustomModalOpen(true)}
                >
                  <Plus size={16} />
                  <span>Добавить "{searchQuery || 'упражнение'}"</span>
                </button>
              </div>
            ) : (
              <ul className="exercise-select-items" role="list">
                {filteredExercises.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="exercise-item-row"
                      onClick={() => {
                        onSelectExercise(item);
                        onClose();
                      }}
                    >
                      <div className="exercise-row-info">
                        <span className="exercise-row-name">
                          {item.name}
                          {item.isCustom && (
                            <span className="custom-badge" title="Пользовательское упражнение">
                              <Sparkles size={11} /> своё
                            </span>
                          )}
                        </span>
                        <div className="exercise-row-meta">
                          <span className="meta-tag">{CATEGORY_LABELS[item.category] || item.category}</span>
                          <span className="meta-tag secondary">{getEquipmentLabel(item.equipment)}</span>
                        </div>
                      </div>
                      <Plus size={18} className="exercise-row-add-icon" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <CustomExerciseModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleCreateCustom}
      />
    </>
  );
};

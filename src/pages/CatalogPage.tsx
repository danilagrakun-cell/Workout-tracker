import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Sparkles,
  Dumbbell,
  ArrowLeft,
  X
} from 'lucide-react';
import { ExerciseCatalogItem } from '../types';
import { catalogService } from '../features/exercises/catalogService';
import { CATEGORY_LABELS, getEquipmentLabel } from '../utils/formatters';
import { CustomExerciseModal } from '../features/exercises/CustomExerciseModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

interface CatalogPageProps {
  onBack?: () => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const [exercises, setExercises] = useState<ExerciseCatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const list = await catalogService.getAll();
      setExercises(list);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return exercises.filter((item) => {
      const matchSearch = !q || item.name.toLowerCase().includes(q);
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [exercises, searchQuery, selectedCategory]);

  const handleCreateCustom = async (data: Omit<ExerciseCatalogItem, 'id' | 'isCustom'>) => {
    try {
      await catalogService.addCustom(data);
      showToast('Упражнение добавлено в каталог', 'success');
      await loadCatalog();
    } catch (err) {
      console.error(err);
      showToast('Ошибка при добавлении упражнения', 'error');
    }
  };

  const handleDeleteCustom = async () => {
    if (!deleteTargetId) return;
    try {
      const success = await catalogService.deleteCustom(deleteTargetId);
      if (success) {
        showToast('Пользовательское упражнение удалено', 'info');
        await loadCatalog();
      } else {
        showToast('Нельзя удалить стандартное упражнение каталога', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка при удалении', 'error');
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="page-container catalog-page">
      <div className="catalog-top-header">
        {onBack && (
          <button type="button" className="icon-btn back-btn mr-2" onClick={onBack} aria-label="Назад">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex-1">
          <h2 className="page-title">Каталог упражнений</h2>
          <p className="page-subtitle">Базовые и ваши персональные упражнения</p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={16} />
          <span>Добавить</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="search-bar-wrapper mb-3">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Поиск упражнения..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Category Pills */}
      <div className="category-pills-scroll mb-3">
        <button
          type="button"
          className={`pill-btn sm ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          Все ({exercises.length})
        </button>
        {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => {
          const count = exercises.filter((e) => e.category === catKey).length;
          if (count === 0) return null;
          return (
            <button
              key={catKey}
              type="button"
              className={`pill-btn sm ${selectedCategory === catKey ? 'active' : ''}`}
              onClick={() => setSelectedCategory(catKey)}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Catalog items list */}
      <div className="catalog-items-list">
        {loading ? (
          <div className="loading-state">Загрузка каталога...</div>
        ) : filtered.length === 0 ? (
          <div className="card empty-catalog-card">
            <Dumbbell size={36} className="empty-icon" />
            <h4 className="empty-title">Упражнения не найдены</h4>
            <p className="empty-desc">
              По запросу «{searchQuery}» ничего не найдено. Вы можете создать его самостоятельно!
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={16} />
              <span>Создать «{searchQuery || 'новое'}»</span>
            </button>
          </div>
        ) : (
          <div className="catalog-grid">
            {filtered.map((item) => (
              <div key={item.id} className="card catalog-item-card">
                <div className="catalog-item-info">
                  <div className="catalog-item-name-row">
                    <span className="catalog-item-name">{item.name}</span>
                    {item.isCustom && (
                      <span className="custom-badge">
                        <Sparkles size={11} /> своё
                      </span>
                    )}
                  </div>
                  <div className="catalog-item-tags">
                    <span className="meta-tag">{CATEGORY_LABELS[item.category] || item.category}</span>
                    <span className="meta-tag secondary">{getEquipmentLabel(item.equipment)}</span>
                  </div>
                </div>

                {item.isCustom && (
                  <button
                    type="button"
                    className="icon-btn-sm danger"
                    onClick={() => setDeleteTargetId(item.id)}
                    title="Удалить пользовательское упражнение"
                    aria-label={`Удалить ${item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CustomExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreateCustom}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Удалить упражнение?"
        message="Вы уверены, что хотите удалить это упражнение из каталога? Ранее сохранённые тренировки с этим упражнением не пострадают."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="danger"
        onConfirm={handleDeleteCustom}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

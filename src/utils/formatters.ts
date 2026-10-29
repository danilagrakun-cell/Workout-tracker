import { WorkoutType, ExerciseCategory, EquipmentType } from '../types';

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  strength: 'Силовая',
  cardio: 'Кардио',
  mixed: 'Смешанная'
};

export const CATEGORY_LABELS: Record<ExerciseCategory | string, string> = {
  chest: 'Грудь',
  back: 'Спина',
  legs: 'Ноги',
  shoulders: 'Плечи',
  arms: 'Руки',
  core: 'Пресс / Кор',
  cardio: 'Кардио',
  fullbody: 'Всё тело',
  other: 'Другое'
};

export const EQUIPMENT_LABELS: Record<EquipmentType | string, string> = {
  barbell: 'Штанга',
  dumbbell: 'Гантели',
  machine: 'Тренажёр',
  cable: 'Блок',
  bodyweight: 'Свой вес',
  kettlebell: 'Гиря',
  cardio_machine: 'Тренажёр',
  none: 'Без снаряда',
  other: 'Другое'
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

export function getEquipmentLabel(equipment: string): string {
  return EQUIPMENT_LABELS[equipment] || equipment;
}

export function getWorkoutTypeLabel(type: WorkoutType): string {
  return WORKOUT_TYPE_LABELS[type] || 'Тренировка';
}

/**
 * Format ISO date string (YYYY-MM-DD) into user-friendly Russian date
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const target = new Date(d);
      target.setHours(0, 0, 0, 0);

      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Сегодня';
      if (diffDays === -1) return 'Вчера';
      if (diffDays === 1) return 'Завтра';

      return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch {
    // Fallback
  }
  return dateStr;
}

/**
 * Get current date as YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format weight: e.g. 20 -> "20 кг", 22.5 -> "22.5 кг"
 */
export function formatWeight(weightKg?: number | null): string {
  if (weightKg === undefined || weightKg === null || isNaN(weightKg)) return '—';
  return `${weightKg} кг`;
}

/**
 * Format repetitions: e.g. 10 -> "10 повт."
 */
export function formatReps(reps?: number | null): string {
  if (reps === undefined || reps === null || isNaN(reps)) return '—';
  return `${reps} повт.`;
}

/**
 * Format seconds into mm:ss or hh:mm:ss
 */
export function formatDuration(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds <= 0) return '—';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs} ч ${mins > 0 ? `${mins} мин` : ''}`.trim();
  }
  if (mins > 0 && secs === 0) {
    return `${mins} мин`;
  }
  return `${mins}:${String(secs).padStart(2, '0')} мин`;
}

/**
 * Format meters: e.g. 5000 -> "5.0 км", 800 -> "800 м"
 */
export function formatDistance(meters?: number | null): string {
  if (meters === undefined || meters === null || isNaN(meters) || meters <= 0) return '—';
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km % 1 === 0 ? km : km.toFixed(2)} км`;
  }
  return `${meters} м`;
}

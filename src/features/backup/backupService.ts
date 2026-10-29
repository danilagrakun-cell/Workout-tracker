import { db } from '../../db/database';
import { BackupData, Workout, WorkoutExercise, WorkoutSet, ExerciseCatalogItem } from '../../types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: BackupData;
}

export const backupService = {
  /**
   * Creates a structured JSON backup object from local IndexedDB
   */
  async createBackup(): Promise<BackupData> {
    const [workouts, exercises, sets, customExercises] = await Promise.all([
      db.workouts.toArray(),
      db.exercises.toArray(),
      db.sets.toArray(),
      db.catalog.where('isCustom').equals(1).toArray()
    ]);

    return {
      version: 1,
      exportDate: new Date().toISOString(),
      workouts,
      exercises,
      sets,
      customExercises
    };
  },

  /**
   * Generates a downloadable JSON file for the user
   */
  async exportToFile(): Promise<void> {
    const backup = await this.createBackup();
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const filename = `workout-diary-backup-${dateStr}.json`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Validates structure and types of an imported backup file content
   */
  validateBackup(json: unknown): ValidationResult {
    if (!json || typeof json !== 'object') {
      return { isValid: false, error: 'Файл не содержит корректный JSON-объект' };
    }

    const obj = json as Record<string, unknown>;

    if (obj.version !== 1) {
      return {
        isValid: false,
        error: `Неподдерживаемая версия формата резервной копии: ${obj.version ?? 'отсутствует'}. Ожидается версия 1.`
      };
    }

    if (!Array.isArray(obj.workouts)) {
      return { isValid: false, error: 'В резервной копии отсутствует список тренировок (workouts)' };
    }

    if (!Array.isArray(obj.exercises)) {
      return { isValid: false, error: 'В резервной копии отсутствует список упражнений (exercises)' };
    }

    if (!Array.isArray(obj.sets)) {
      return { isValid: false, error: 'В резервной копии отсутствует список подходов (sets)' };
    }

    // Validate workout entities
    for (let i = 0; i < obj.workouts.length; i++) {
      const w = obj.workouts[i] as Partial<Workout>;
      if (!w.id || typeof w.id !== 'string') {
        return { isValid: false, error: `Тренировка №${i + 1} содержит некорректный идентификатор` };
      }
      if (!w.date || typeof w.date !== 'string') {
        return { isValid: false, error: `Тренировка "${w.title || w.id}" не содержит корректную дату` };
      }
    }

    // Validate exercise entities
    for (let i = 0; i < obj.exercises.length; i++) {
      const e = obj.exercises[i] as Partial<WorkoutExercise>;
      if (!e.id || !e.workoutId || !e.name) {
        return { isValid: false, error: `Упражнение №${i + 1} содержит неполные данные` };
      }
    }

    // Validate set entities
    for (let i = 0; i < obj.sets.length; i++) {
      const s = obj.sets[i] as Partial<WorkoutSet>;
      if (!s.id || !s.exerciseId) {
        return { isValid: false, error: `Подход №${i + 1} содержит некорректный идентификатор или связь` };
      }
    }

    const customExercises = Array.isArray(obj.customExercises)
      ? (obj.customExercises as ExerciseCatalogItem[])
      : [];

    return {
      isValid: true,
      data: {
        version: 1,
        exportDate: typeof obj.exportDate === 'string' ? obj.exportDate : new Date().toISOString(),
        workouts: obj.workouts as Workout[],
        exercises: obj.exercises as WorkoutExercise[],
        sets: obj.sets as WorkoutSet[],
        customExercises
      }
    };
  },

  /**
   * Restores database from a validated backup object
   */
  async restoreBackup(backup: BackupData): Promise<void> {
    return db.restoreBackup(backup);
  }
};

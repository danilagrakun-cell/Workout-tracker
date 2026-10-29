export type WorkoutType = 'strength' | 'cardio' | 'mixed';

export type ExerciseCategory =
  | 'chest'      // Грудь
  | 'back'       // Спина
  | 'legs'       // Ноги
  | 'shoulders'  // Плечи
  | 'arms'       // Руки (бицепс/трицепс)
  | 'core'       // Пресс и кор
  | 'cardio'     // Кардио
  | 'fullbody'   // Всё тело
  | 'other';     // Другое

export type EquipmentType =
  | 'barbell'         // Штанга
  | 'dumbbell'        // Гантели
  | 'machine'         // Тренажёр
  | 'cable'           // Блочный тренажёр
  | 'bodyweight'      // Собственный вес
  | 'kettlebell'      // Гиря
  | 'cardio_machine'  // Кардиотренажёр
  | 'none'            // Без инвентаря
  | 'other';          // Другое

export type ExerciseType = 'strength' | 'cardio' | 'duration';

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  type: WorkoutType;
  title: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  name: string;
  category: ExerciseCategory | string;
  position: number;
  notes?: string;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  position: number;
  reps?: number | null;
  weightKg?: number | null;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  notes?: string;
}

export interface ExerciseCatalogItem {
  id: string;
  name: string;
  category: ExerciseCategory | string;
  equipment: EquipmentType | string;
  exerciseType: ExerciseType;
  isCustom?: boolean;
}

export interface ExerciseWithSets extends WorkoutExercise {
  sets: WorkoutSet[];
}

export interface WorkoutWithDetails extends Workout {
  exercises: ExerciseWithSets[];
}

export interface BackupData {
  version: 1;
  exportDate: string;
  workouts: Workout[];
  exercises: WorkoutExercise[];
  sets: WorkoutSet[];
  customExercises: ExerciseCatalogItem[];
}

export type ThemeMode = 'dark' | 'light' | 'system';

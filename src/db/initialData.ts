import { ExerciseCatalogItem } from '../types';

export const INITIAL_EXERCISES: ExerciseCatalogItem[] = [
  {
    id: 'seed_bench_press',
    name: 'Жим лёжа',
    category: 'chest',
    equipment: 'barbell',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_squat',
    name: 'Приседания со штангой',
    category: 'legs',
    equipment: 'barbell',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_deadlift',
    name: 'Становая тяга',
    category: 'back',
    equipment: 'barbell',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_pull_ups',
    name: 'Подтягивания',
    category: 'back',
    equipment: 'bodyweight',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_lat_pulldown',
    name: 'Тяга верхнего блока',
    category: 'back',
    equipment: 'cable',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_dumbbell_row',
    name: 'Тяга гантели',
    category: 'back',
    equipment: 'dumbbell',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_dumbbell_press',
    name: 'Жим гантелей',
    category: 'chest',
    equipment: 'dumbbell',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_bicep_curls',
    name: 'Сгибания рук на бицепс',
    category: 'arms',
    equipment: 'dumbbell',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_tricep_extension',
    name: 'Разгибания рук на трицепс',
    category: 'arms',
    equipment: 'cable',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_leg_press',
    name: 'Жим ногами',
    category: 'legs',
    equipment: 'machine',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_plank',
    name: 'Планка',
    category: 'core',
    equipment: 'none',
    exerciseType: 'duration',
    isCustom: false
  },
  {
    id: 'seed_running',
    name: 'Бег',
    category: 'cardio',
    equipment: 'none',
    exerciseType: 'cardio',
    isCustom: false
  },
  {
    id: 'seed_stationary_bike',
    name: 'Велотренажёр',
    category: 'cardio',
    equipment: 'cardio_machine',
    exerciseType: 'cardio',
    isCustom: false
  },
  {
    id: 'seed_walking',
    name: 'Ходьба',
    category: 'cardio',
    equipment: 'none',
    exerciseType: 'cardio',
    isCustom: false
  },
  // Additional practical exercises to make the catalog even more useful
  {
    id: 'seed_overhead_press',
    name: 'Армейский жим стоя',
    category: 'shoulders',
    equipment: 'barbell',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_lateral_raises',
    name: 'Махи гантелями в стороны',
    category: 'shoulders',
    equipment: 'dumbbell',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_lunges',
    name: 'Выпады с гантелями',
    category: 'legs',
    equipment: 'dumbbell',
    exerciseType: 'strength',
    isCustom: false
  },
  {
    id: 'seed_crunches',
    name: 'Скручивания на пресс',
    category: 'core',
    equipment: 'none',
    exerciseType: 'strength',
    isCustom: false
  }
];

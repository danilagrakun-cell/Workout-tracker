import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateExercisesVolume,
  calculate1RM,
  progressService
} from '../features/progress/progressService';
import { db } from '../db/database';
import { workoutService } from '../features/workouts/workoutService';
import { WorkoutExercise, WorkoutSet, Workout } from '../types';
import { generateId } from '../utils/id';

describe('Progress and Volume Calculations', () => {
  beforeEach(async () => {
    await db.workouts.clear();
    await db.exercises.clear();
    await db.sets.clear();
  });

  it('calculates volume strictly for weight * reps without combining cardio units', () => {
    const strengthEx: WorkoutExercise = {
      id: 'ex1',
      workoutId: 'w1',
      name: 'Приседания',
      category: 'legs',
      position: 1
    };

    const cardioEx: WorkoutExercise = {
      id: 'ex2',
      workoutId: 'w1',
      name: 'Бег',
      category: 'cardio',
      position: 2
    };

    const strengthSets: WorkoutSet[] = [
      { id: 's1', exerciseId: 'ex1', position: 1, weightKg: 100, reps: 5 }, // 500 kg
      { id: 's2', exerciseId: 'ex1', position: 2, weightKg: 22.5, reps: 10 } // 225 kg
    ];

    const cardioSets: WorkoutSet[] = [
      // 1800 seconds and 5000 meters - MUST NOT be added to kg volume
      { id: 's3', exerciseId: 'ex2', position: 1, durationSeconds: 1800, distanceMeters: 5000, weightKg: null, reps: null }
    ];

    const volume = calculateExercisesVolume([
      { ...strengthEx, sets: strengthSets },
      { ...cardioEx, sets: cardioSets }
    ]);

    expect(volume).toBe(725);
  });

  it('calculates 1RM estimate using Brzycki formula correctly', () => {
    expect(calculate1RM(100, 1)).toBe(100);
    expect(calculate1RM(0, 10)).toBe(0);

    // 100 kg for 10 reps: 100 * (36 / (37 - 10)) = 100 * (36 / 27) = 133.3 kg
    const est = calculate1RM(100, 10);
    expect(est).toBe(133.3);
  });

  it('tracks progression across multiple workouts over time', async () => {
    // Workout 1 on Oct 10
    const w1Id = generateId();
    const w1: Workout = {
      id: w1Id,
      date: '2026-10-10',
      type: 'strength',
      title: 'Тренировка 1',
      createdAt: 1000,
      updatedAt: 1000
    };
    const ex1: WorkoutExercise = {
      id: generateId(),
      workoutId: w1Id,
      name: 'Жим лёжа',
      category: 'chest',
      position: 1
    };
    const s1: WorkoutSet[] = [
      { id: generateId(), exerciseId: ex1.id, position: 1, weightKg: 80, reps: 10 }
    ];
    await workoutService.saveWorkout(w1, [{ exercise: ex1, sets: s1 }]);

    // Workout 2 on Oct 20 with higher weight
    const w2Id = generateId();
    const w2: Workout = {
      id: w2Id,
      date: '2026-10-20',
      type: 'strength',
      title: 'Тренировка 2',
      createdAt: 2000,
      updatedAt: 2000
    };
    const ex2: WorkoutExercise = {
      id: generateId(),
      workoutId: w2Id,
      name: 'Жим лёжа',
      category: 'chest',
      position: 1
    };
    const s2: WorkoutSet[] = [
      { id: generateId(), exerciseId: ex2.id, position: 1, weightKg: 85, reps: 8 }
    ];
    await workoutService.saveWorkout(w2, [{ exercise: ex2, sets: s2 }]);

    const progress = await progressService.getExerciseProgress('Жим лёжа');
    expect(progress.length).toBe(2);
    expect(progress[0].date).toBe('2026-10-10');
    expect(progress[0].maxWeightKg).toBe(80);
    expect(progress[1].date).toBe('2026-10-20');
    expect(progress[1].maxWeightKg).toBe(85);
  });
});

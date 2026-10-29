import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/database';
import { workoutService } from '../features/workouts/workoutService';
import { Workout, WorkoutExercise, WorkoutSet } from '../types';
import { generateId } from '../utils/id';

describe('Database and Workout Services', () => {
  beforeEach(async () => {
    await db.workouts.clear();
    await db.exercises.clear();
    await db.sets.clear();
    await db.catalog.clear();
    await db.ensureInitialCatalog();
  });

  it('creates and reads a workout with exercises and sets', async () => {
    const workoutId = generateId();
    const workout: Workout = {
      id: workoutId,
      date: '2026-10-29',
      type: 'strength',
      title: 'День груди',
      notes: 'Отличная тренировка',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const exId = generateId();
    const exercise: WorkoutExercise = {
      id: exId,
      workoutId,
      name: 'Жим лёжа',
      category: 'chest',
      position: 1
    };

    const sets: WorkoutSet[] = [
      { id: generateId(), exerciseId: exId, position: 1, weightKg: 80, reps: 10 },
      { id: generateId(), exerciseId: exId, position: 2, weightKg: 85, reps: 8 }
    ];

    await workoutService.saveWorkout(workout, [{ exercise, sets }]);

    // Read back
    const retrieved = await workoutService.getWorkoutWithDetails(workoutId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(workoutId);
    expect(retrieved?.title).toBe('День груди');
    expect(retrieved?.exercises.length).toBe(1);
    expect(retrieved?.exercises[0].name).toBe('Жим лёжа');
    expect(retrieved?.exercises[0].sets.length).toBe(2);
    expect(retrieved?.exercises[0].sets[0].weightKg).toBe(80);
    expect(retrieved?.exercises[0].sets[1].weightKg).toBe(85);
  });

  it('edits a workout and its sets', async () => {
    const workoutId = generateId();
    const workout: Workout = {
      id: workoutId,
      date: '2026-10-29',
      type: 'strength',
      title: 'Приседания',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const exId = generateId();
    const exercise: WorkoutExercise = {
      id: exId,
      workoutId,
      name: 'Приседания со штангой',
      category: 'legs',
      position: 1
    };

    const sets: WorkoutSet[] = [
      { id: generateId(), exerciseId: exId, position: 1, weightKg: 100, reps: 5 }
    ];

    await workoutService.saveWorkout(workout, [{ exercise, sets }]);

    // Update with 2 sets and new title
    const updatedWorkout: Workout = {
      ...workout,
      title: 'Тяжёлые приседания',
      updatedAt: Date.now()
    };

    const updatedSets: WorkoutSet[] = [
      { id: sets[0].id, exerciseId: exId, position: 1, weightKg: 105, reps: 5 },
      { id: generateId(), exerciseId: exId, position: 2, weightKg: 110, reps: 3 }
    ];

    await workoutService.saveWorkout(updatedWorkout, [{ exercise, sets: updatedSets }]);

    const retrieved = await workoutService.getWorkoutWithDetails(workoutId);
    expect(retrieved?.title).toBe('Тяжёлые приседания');
    expect(retrieved?.exercises[0].sets.length).toBe(2);
    expect(retrieved?.exercises[0].sets[0].weightKg).toBe(105);
    expect(retrieved?.exercises[0].sets[1].weightKg).toBe(110);
  });

  it('deletes a workout and cascades all related exercises and sets', async () => {
    const workoutId = generateId();
    const workout: Workout = {
      id: workoutId,
      date: '2026-10-29',
      type: 'strength',
      title: 'Тренировка под удаление',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const exId = generateId();
    const exercise: WorkoutExercise = {
      id: exId,
      workoutId,
      name: 'Тяга блока',
      category: 'back',
      position: 1
    };

    const sets: WorkoutSet[] = [
      { id: generateId(), exerciseId: exId, position: 1, weightKg: 60, reps: 12 },
      { id: generateId(), exerciseId: exId, position: 2, weightKg: 65, reps: 10 }
    ];

    await workoutService.saveWorkout(workout, [{ exercise, sets }]);

    // Verify records exist in raw tables
    expect(await db.workouts.count()).toBe(1);
    expect(await db.exercises.count()).toBe(1);
    expect(await db.sets.count()).toBe(2);

    // Delete cascade
    await workoutService.deleteWorkout(workoutId);

    // Verify completely purged without orphaned records
    expect(await db.workouts.count()).toBe(0);
    expect(await db.exercises.count()).toBe(0);
    expect(await db.sets.count()).toBe(0);
  });

  it('duplicates a workout structure with new IDs without modifying original', async () => {
    const originalId = generateId();
    const originalWorkout: Workout = {
      id: originalId,
      date: '2026-10-20',
      type: 'strength',
      title: 'День ног',
      notes: 'Заметка исходника',
      createdAt: 1000,
      updatedAt: 1000
    };

    const originalExId = generateId();
    const exercise: WorkoutExercise = {
      id: originalExId,
      workoutId: originalId,
      name: 'Жим ногами',
      category: 'legs',
      position: 1
    };

    const sets: WorkoutSet[] = [
      { id: generateId(), exerciseId: originalExId, position: 1, weightKg: 150, reps: 12 }
    ];

    await workoutService.saveWorkout(originalWorkout, [{ exercise, sets }]);

    // Duplicate to new date
    const duplicated = await workoutService.duplicateWorkout(originalId, '2026-10-29');

    expect(duplicated).not.toBeNull();
    expect(duplicated?.id).not.toBe(originalId);
    expect(duplicated?.date).toBe('2026-10-29');
    expect(duplicated?.title).toContain('День ног');
    expect(duplicated?.exercises[0].name).toBe('Жим ногами');
    expect(duplicated?.exercises[0].id).not.toBe(originalExId);
    expect(duplicated?.exercises[0].sets[0].weightKg).toBe(150);

    // Original must still exist intact
    const originalCheck = await workoutService.getWorkoutWithDetails(originalId);
    expect(originalCheck).not.toBeNull();
    expect(originalCheck?.date).toBe('2026-10-20');
    expect(await db.workouts.count()).toBe(2);
  });
});

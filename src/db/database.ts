import Dexie, { type Table } from 'dexie';
import {
  Workout,
  WorkoutExercise,
  WorkoutSet,
  ExerciseCatalogItem,
  WorkoutWithDetails,
  BackupData
} from '../types';
import { INITIAL_EXERCISES } from './initialData';
import { generateId } from '../utils/id';

export class WorkoutDatabase extends Dexie {
  workouts!: Table<Workout, string>;
  exercises!: Table<WorkoutExercise, string>;
  sets!: Table<WorkoutSet, string>;
  catalog!: Table<ExerciseCatalogItem, string>;

  constructor() {
    super('WorkoutDiaryDB');

    this.version(1).stores({
      workouts: 'id, date, type, createdAt, updatedAt',
      exercises: 'id, workoutId, category, position',
      sets: 'id, exerciseId, position',
      catalog: 'id, name, category, equipment, exerciseType, isCustom'
    });

    // Populate catalog on database creation
    this.on('populate', (tx) => {
      tx.table('catalog').bulkAdd(INITIAL_EXERCISES);
    });
  }

  /**
   * Ensures the initial exercise catalog is populated even if database was created earlier
   */
  async ensureInitialCatalog(): Promise<void> {
    const count = await this.catalog.count();
    if (count === 0) {
      await this.catalog.bulkAdd(INITIAL_EXERCISES);
    }
  }

  /**
   * Fetches a full workout with its exercises and sets
   */
  async getWorkoutWithDetails(workoutId: string): Promise<WorkoutWithDetails | null> {
    const workout = await this.workouts.get(workoutId);
    if (!workout) return null;

    const exercises = await this.exercises
      .where('workoutId')
      .equals(workoutId)
      .sortBy('position');

    const exerciseIds = exercises.map((e) => e.id);
    const allSets = exerciseIds.length > 0
      ? await this.sets.where('exerciseId').anyOf(exerciseIds).sortBy('position')
      : [];

    const setsByExercise = new Map<string, WorkoutSet[]>();
    for (const set of allSets) {
      const list = setsByExercise.get(set.exerciseId) || [];
      list.push(set);
      setsByExercise.set(set.exerciseId, list);
    }

    const detailedExercises = exercises.map((exercise) => ({
      ...exercise,
      sets: setsByExercise.get(exercise.id) || []
    }));

    return {
      ...workout,
      exercises: detailedExercises
    };
  }

  /**
   * Saves or updates a full workout with all exercises and sets atomically in a single transaction.
   */
  async saveWorkoutWithDetails(
    workout: Workout,
    exercisesWithSets: { exercise: WorkoutExercise; sets: WorkoutSet[] }[]
  ): Promise<void> {
    await this.transaction('rw', this.workouts, this.exercises, this.sets, async () => {
      // 1. Find existing exercises to remove old sets
      const existingExercises = await this.exercises
        .where('workoutId')
        .equals(workout.id)
        .toArray();

      const existingExerciseIds = existingExercises.map((e) => e.id);
      if (existingExerciseIds.length > 0) {
        await this.sets.where('exerciseId').anyOf(existingExerciseIds).delete();
        await this.exercises.where('workoutId').equals(workout.id).delete();
      }

      // 2. Insert updated workout
      await this.workouts.put(workout);

      // 3. Prepare exercises and sets with assigned positions
      const exercisesToInsert: WorkoutExercise[] = [];
      const setsToInsert: WorkoutSet[] = [];

      exercisesWithSets.forEach((item, exIndex) => {
        const exerciseId = item.exercise.id || generateId();
        exercisesToInsert.push({
          ...item.exercise,
          id: exerciseId,
          workoutId: workout.id,
          position: exIndex + 1
        });

        item.sets.forEach((set, setIndex) => {
          setsToInsert.push({
            ...set,
            id: set.id || generateId(),
            exerciseId: exerciseId,
            position: setIndex + 1
          });
        });
      });

      if (exercisesToInsert.length > 0) {
        await this.exercises.bulkAdd(exercisesToInsert);
      }
      if (setsToInsert.length > 0) {
        await this.sets.bulkAdd(setsToInsert);
      }
    });
  }

  /**
   * Deletes a workout and all its exercises and sets atomically in a single transaction.
   */
  async deleteWorkoutCascade(workoutId: string): Promise<void> {
    await this.transaction('rw', this.workouts, this.exercises, this.sets, async () => {
      const exercises = await this.exercises
        .where('workoutId')
        .equals(workoutId)
        .toArray();

      const exerciseIds = exercises.map((e) => e.id);
      if (exerciseIds.length > 0) {
        await this.sets.where('exerciseId').anyOf(exerciseIds).delete();
        await this.exercises.where('workoutId').equals(workoutId).delete();
      }

      await this.workouts.delete(workoutId);
    });
  }

  /**
   * Duplicates a workout structure to create a new workout:
   * Copies exercises and their parameters, creates new IDs, does NOT modify the original workout.
   */
  async duplicateWorkoutStructure(originalWorkoutId: string, newDate: string): Promise<WorkoutWithDetails | null> {
    const original = await this.getWorkoutWithDetails(originalWorkoutId);
    if (!original) return null;

    const newWorkoutId = generateId();
    const now = Date.now();

    const newWorkout: Workout = {
      id: newWorkoutId,
      date: newDate,
      type: original.type,
      title: `${original.title} (повтор)`,
      notes: original.notes,
      createdAt: now,
      updatedAt: now
    };

    const newExercisesWithSets = original.exercises.map((ex, exIndex) => {
      const newExId = generateId();
      const newExercise: WorkoutExercise = {
        id: newExId,
        workoutId: newWorkoutId,
        name: ex.name,
        category: ex.category,
        position: exIndex + 1,
        notes: ex.notes
      };

      const newSets: WorkoutSet[] = ex.sets.map((s, sIndex) => ({
        id: generateId(),
        exerciseId: newExId,
        position: sIndex + 1,
        reps: s.reps,
        weightKg: s.weightKg,
        durationSeconds: s.durationSeconds,
        distanceMeters: s.distanceMeters,
        notes: s.notes
      }));

      return {
        exercise: newExercise,
        sets: newSets
      };
    });

    await this.saveWorkoutWithDetails(newWorkout, newExercisesWithSets);

    return this.getWorkoutWithDetails(newWorkoutId);
  }

  /**
   * Restores a full backup atomically. All existing user data is replaced in one transaction.
   */
  async restoreBackup(backup: BackupData): Promise<void> {
    await this.transaction('rw', this.workouts, this.exercises, this.sets, this.catalog, async () => {
      // Clear existing user data
      await this.workouts.clear();
      await this.exercises.clear();
      await this.sets.clear();

      // Only delete custom exercises, keep default seed or re-seed
      await this.catalog.where('isCustom').equals(1).delete();

      // Re-populate workouts, exercises, sets
      if (backup.workouts && backup.workouts.length > 0) {
        await this.workouts.bulkAdd(backup.workouts);
      }
      if (backup.exercises && backup.exercises.length > 0) {
        await this.exercises.bulkAdd(backup.exercises);
      }
      if (backup.sets && backup.sets.length > 0) {
        await this.sets.bulkAdd(backup.sets);
      }

      // Add custom exercises if present
      if (backup.customExercises && backup.customExercises.length > 0) {
        await this.catalog.bulkPut(backup.customExercises);
      }

      // Ensure seed catalog remains present
      const currentCatalog = await this.catalog.toArray();
      const existingCatalogIds = new Set(currentCatalog.map((c) => c.id));
      const missingSeeds = INITIAL_EXERCISES.filter((seed) => !existingCatalogIds.has(seed.id));
      if (missingSeeds.length > 0) {
        await this.catalog.bulkAdd(missingSeeds);
      }
    });
  }
}

export const db = new WorkoutDatabase();

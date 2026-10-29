import { db } from '../../db/database';
import { WorkoutExercise, WorkoutSet, ExerciseWithSets } from '../../types';

export interface ExerciseDataPoint {
  date: string;
  workoutTitle: string;
  maxWeightKg: number;
  maxReps: number;
  estimated1RM: number;
  totalVolumeKg: number;
  setsCount: number;
}

export interface VolumeDataPoint {
  workoutId: string;
  date: string;
  title: string;
  volumeKg: number;
  setsCount: number;
}

export interface OverallStats {
  totalWorkouts: number;
  weekWorkouts: number;
  monthWorkouts: number;
  totalVolumeKg: number;
  totalSets: number;
}

/**
 * Calculates Brzycki 1RM formula: weight * (36 / (37 - min(reps, 30)))
 */
export function calculate1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  const clampedReps = Math.min(reps, 30);
  const estimate = weightKg * (36 / (37 - clampedReps));
  return Math.round(estimate * 10) / 10;
}

/**
 * Calculates volume (tonnage) in kg for a list of exercises and their sets.
 * Only includes sets where both weightKg and reps are positive numbers.
 */
export function calculateExercisesVolume(exercises: ExerciseWithSets[]): number {
  let total = 0;
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (
        set.weightKg != null &&
        set.weightKg > 0 &&
        set.reps != null &&
        set.reps > 0
      ) {
        total += set.weightKg * set.reps;
      }
    }
  }
  return Math.round(total * 100) / 100;
}

export const progressService = {
  /**
   * Returns list of unique exercise names that have at least one set in the workouts history
   */
  async getTrackedExerciseNames(): Promise<string[]> {
    const exercises = await db.exercises.toArray();
    const namesSet = new Set<string>();
    for (const ex of exercises) {
      if (ex.name && ex.name.trim()) {
        namesSet.add(ex.name.trim());
      }
    }
    return Array.from(namesSet).sort((a, b) => a.localeCompare(b, 'ru'));
  },

  /**
   * Computes progression points over time for a given exercise name
   */
  async getExerciseProgress(exerciseName: string): Promise<ExerciseDataPoint[]> {
    if (!exerciseName) return [];

    const targetName = exerciseName.trim().toLowerCase();

    // 1. Get all exercises matching the name
    const allMatchingExercises = await db.exercises
      .filter((ex) => ex.name.trim().toLowerCase() === targetName)
      .toArray();

    if (allMatchingExercises.length === 0) return [];

    const exerciseIds = allMatchingExercises.map((e) => e.id);
    const workoutIds = Array.from(new Set(allMatchingExercises.map((e) => e.workoutId)));

    // 2. Fetch related workouts and sets
    const [workouts, sets] = await Promise.all([
      db.workouts.where('id').anyOf(workoutIds).toArray(),
      db.sets.where('exerciseId').anyOf(exerciseIds).toArray()
    ]);

    const workoutMap = new Map(workouts.map((w) => [w.id, w]));

    const setsByExerciseId = new Map<string, WorkoutSet[]>();
    for (const set of sets) {
      const list = setsByExerciseId.get(set.exerciseId) || [];
      list.push(set);
      setsByExerciseId.set(set.exerciseId, list);
    }

    // 3. Group by workout date
    const datePoints: ExerciseDataPoint[] = [];

    for (const ex of allMatchingExercises) {
      const workout = workoutMap.get(ex.workoutId);
      if (!workout) continue;

      const exSets = setsByExerciseId.get(ex.id) || [];
      if (exSets.length === 0) continue;

      let maxWeight = 0;
      let maxRepsForMaxWeight = 0;
      let best1RM = 0;
      let totalVolume = 0;
      let validSetsCount = 0;

      for (const set of exSets) {
        const weight = set.weightKg ?? 0;
        const reps = set.reps ?? 0;

        if (weight > 0 && reps > 0) {
          totalVolume += weight * reps;
          validSetsCount++;

          const oneRm = calculate1RM(weight, reps);
          if (oneRm > best1RM) {
            best1RM = oneRm;
          }

          if (weight > maxWeight) {
            maxWeight = weight;
            maxRepsForMaxWeight = reps;
          } else if (weight === maxWeight && reps > maxRepsForMaxWeight) {
            maxRepsForMaxWeight = reps;
          }
        } else if (reps > 0 && maxWeight === 0) {
          // Bodyweight exercise with reps only
          if (reps > maxRepsForMaxWeight) {
            maxRepsForMaxWeight = reps;
          }
          validSetsCount++;
        }
      }

      if (validSetsCount > 0) {
        datePoints.push({
          date: workout.date,
          workoutTitle: workout.title,
          maxWeightKg: maxWeight,
          maxReps: maxRepsForMaxWeight,
          estimated1RM: best1RM,
          totalVolumeKg: Math.round(totalVolume * 10) / 10,
          setsCount: exSets.length
        });
      }
    }

    // Sort by date ascending for timeline chart
    return datePoints.sort((a, b) => a.date.localeCompare(b.date));
  },

  /**
   * Returns volume load history across all workouts
   */
  async getVolumeHistory(limit = 20): Promise<VolumeDataPoint[]> {
    const workouts = await db.workouts.orderBy('date').toArray();
    if (workouts.length === 0) return [];

    const recentWorkouts = workouts.slice(-limit);
    const workoutIds = recentWorkouts.map((w) => w.id);

    const exercises = await db.exercises.where('workoutId').anyOf(workoutIds).toArray();
    const exerciseIds = exercises.map((e) => e.id);

    const sets = exerciseIds.length > 0
      ? await db.sets.where('exerciseId').anyOf(exerciseIds).toArray()
      : [];

    const setsByExerciseId = new Map<string, WorkoutSet[]>();
    for (const set of sets) {
      const list = setsByExerciseId.get(set.exerciseId) || [];
      list.push(set);
      setsByExerciseId.set(set.exerciseId, list);
    }

    const exercisesByWorkoutId = new Map<string, WorkoutExercise[]>();
    for (const ex of exercises) {
      const list = exercisesByWorkoutId.get(ex.workoutId) || [];
      list.push(ex);
      exercisesByWorkoutId.set(ex.workoutId, list);
    }

    const points: VolumeDataPoint[] = [];

    for (const w of recentWorkouts) {
      const wExercises = exercisesByWorkoutId.get(w.id) || [];
      let volume = 0;
      let totalSets = 0;

      for (const ex of wExercises) {
        const exSets = setsByExerciseId.get(ex.id) || [];
        totalSets += exSets.length;
        for (const s of exSets) {
          if (s.weightKg && s.weightKg > 0 && s.reps && s.reps > 0) {
            volume += s.weightKg * s.reps;
          }
        }
      }

      points.push({
        workoutId: w.id,
        date: w.date,
        title: w.title,
        volumeKg: Math.round(volume),
        setsCount: totalSets
      });
    }

    return points;
  },

  /**
   * Computes high-level aggregated summary statistics
   */
  async getOverallStats(): Promise<OverallStats> {
    const [workouts, sets] = await Promise.all([
      db.workouts.toArray(),
      db.sets.toArray()
    ]);

    const totalWorkouts = workouts.length;

    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const mondayStr = monday.toISOString().slice(0, 10);

    const firstOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    let weekWorkouts = 0;
    let monthWorkouts = 0;

    for (const w of workouts) {
      if (w.date >= mondayStr) weekWorkouts++;
      if (w.date >= firstOfMonthStr) monthWorkouts++;
    }

    let totalVolumeKg = 0;
    for (const s of sets) {
      if (s.weightKg && s.weightKg > 0 && s.reps && s.reps > 0) {
        totalVolumeKg += s.weightKg * s.reps;
      }
    }

    return {
      totalWorkouts,
      weekWorkouts,
      monthWorkouts,
      totalVolumeKg: Math.round(totalVolumeKg),
      totalSets: sets.length
    };
  }
};

import { db } from '../../db/database';
import { Workout, WorkoutType, WorkoutWithDetails, WorkoutExercise, WorkoutSet } from '../../types';

export interface WorkoutFilter {
  period?: 'all' | 'week' | 'month' | 'custom';
  type?: WorkoutType | 'all';
  startDate?: string;
  endDate?: string;
}

export const workoutService = {
  /**
   * Fetches all workouts matching the optional filter, sorted descending by date.
   */
  async getWorkouts(filter?: WorkoutFilter): Promise<Workout[]> {
    let collection = db.workouts.orderBy('date').reverse();

    let list = await collection.toArray();

    if (!filter) return list;

    // Filter by type
    if (filter.type && filter.type !== 'all') {
      list = list.filter((w) => w.type === filter.type);
    }

    // Filter by period
    if (filter.period && filter.period !== 'all') {
      const now = new Date();
      now.setHours(23, 59, 59, 999);

      if (filter.period === 'week') {
        // Monday of current week
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);

        const mondayStr = monday.toISOString().slice(0, 10);
        list = list.filter((w) => w.date >= mondayStr);
      } else if (filter.period === 'month') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayStr = firstDayOfMonth.toISOString().slice(0, 10);
        list = list.filter((w) => w.date >= firstDayStr);
      }
    }

    // Filter by custom range if provided
    if (filter.startDate) {
      list = list.filter((w) => w.date >= filter.startDate!);
    }
    if (filter.endDate) {
      list = list.filter((w) => w.date <= filter.endDate!);
    }

    return list;
  },

  /**
   * Fetches a workout with all exercises and sets
   */
  async getWorkoutWithDetails(id: string): Promise<WorkoutWithDetails | null> {
    return db.getWorkoutWithDetails(id);
  },

  /**
   * Saves or updates a full workout with its exercises and sets
   */
  async saveWorkout(
    workout: Workout,
    exercisesWithSets: { exercise: WorkoutExercise; sets: WorkoutSet[] }[]
  ): Promise<void> {
    return db.saveWorkoutWithDetails(workout, exercisesWithSets);
  },

  /**
   * Deletes a workout and all related exercises and sets
   */
  async deleteWorkout(id: string): Promise<void> {
    return db.deleteWorkoutCascade(id);
  },

  /**
   * Duplicates a workout structure to a new date
   */
  async duplicateWorkout(id: string, newDate: string): Promise<WorkoutWithDetails | null> {
    return db.duplicateWorkoutStructure(id, newDate);
  },

  /**
   * Gets the most recent workout
   */
  async getLastWorkout(): Promise<WorkoutWithDetails | null> {
    const latest = await db.workouts.orderBy('date').reverse().first();
    if (!latest) return null;
    return db.getWorkoutWithDetails(latest.id);
  },

  /**
   * Counts workouts done during current calendar week (Monday to Sunday)
   */
  async getWorkoutsCountThisWeek(): Promise<number> {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const mondayStr = monday.toISOString().slice(0, 10);

    const count = await db.workouts
      .where('date')
      .aboveOrEqual(mondayStr)
      .count();

    return count;
  },

  /**
   * Counts workouts done during current calendar month
   */
  async getWorkoutsCountThisMonth(): Promise<number> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayStr = firstDay.toISOString().slice(0, 10);

    const count = await db.workouts
      .where('date')
      .aboveOrEqual(firstDayStr)
      .count();

    return count;
  },

  /**
   * Total number of workouts
   */
  async getTotalWorkoutsCount(): Promise<number> {
    return db.workouts.count();
  }
};

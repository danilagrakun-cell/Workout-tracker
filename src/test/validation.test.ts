import { describe, it, expect } from 'vitest';
import {
  validateWeight,
  validateReps,
  validateDistance,
  validateDuration
} from '../utils/validators';
import { backupService } from '../features/backup/backupService';

describe('Validation Utilities', () => {
  it('validates weight and supports fractional values', () => {
    expect(validateWeight('22.5').isValid).toBe(true);
    expect(validateWeight('22.5').value).toBe(22.5);

    expect(validateWeight('22,5').isValid).toBe(true);
    expect(validateWeight('22,5').value).toBe(22.5);

    expect(validateWeight('0').isValid).toBe(true);
    expect(validateWeight('0').value).toBe(0);

    expect(validateWeight('').value).toBeNull();
    expect(validateWeight(null).value).toBeNull();

    // Rejects negative weights
    const neg = validateWeight('-10');
    expect(neg.isValid).toBe(false);
    expect(neg.error).toBeDefined();

    // Rejects invalid strings
    const str = validateWeight('abc');
    expect(str.isValid).toBe(false);
  });

  it('validates reps as non-negative integers', () => {
    expect(validateReps('12').isValid).toBe(true);
    expect(validateReps('12').value).toBe(12);

    expect(validateReps('0').isValid).toBe(true);
    expect(validateReps('0').value).toBe(0);

    // Rejects negative reps
    expect(validateReps('-5').isValid).toBe(false);

    // Rejects fractional reps
    expect(validateReps('12.5').isValid).toBe(false);
  });

  it('validates distance and duration without allowing negative numbers', () => {
    expect(validateDistance('5000').value).toBe(5000);
    expect(validateDistance('-500').isValid).toBe(false);

    expect(validateDuration('1800').value).toBe(1800);
    expect(validateDuration('-60').isValid).toBe(false);
  });
});

describe('Backup Format and Schema Validation', () => {
  it('accepts valid backup JSON data', () => {
    const validData = {
      version: 1,
      exportDate: '2026-10-29T12:00:00.000Z',
      workouts: [
        {
          id: 'w1',
          date: '2026-10-29',
          type: 'strength',
          title: 'Силовая',
          createdAt: 1000,
          updatedAt: 1000
        }
      ],
      exercises: [
        {
          id: 'e1',
          workoutId: 'w1',
          name: 'Жим лёжа',
          category: 'chest',
          position: 1
        }
      ],
      sets: [
        {
          id: 's1',
          exerciseId: 'e1',
          position: 1,
          weightKg: 80,
          reps: 10
        }
      ],
      customExercises: []
    };

    const result = backupService.validateBackup(validData);
    expect(result.isValid).toBe(true);
    expect(result.data?.workouts.length).toBe(1);
    expect(result.data?.exercises.length).toBe(1);
  });

  it('rejects unsupported backup versions', () => {
    const invalidVersion = {
      version: 99,
      workouts: [],
      exercises: [],
      sets: []
    };
    const result = backupService.validateBackup(invalidVersion);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Неподдерживаемая версия');
  });

  it('rejects malformed or incomplete backup payload', () => {
    expect(backupService.validateBackup(null).isValid).toBe(false);
    expect(backupService.validateBackup("string instead of obj").isValid).toBe(false);

    const missingWorkouts = {
      version: 1,
      exercises: [],
      sets: []
    };
    expect(backupService.validateBackup(missingWorkouts).isValid).toBe(false);

    const corruptedWorkout = {
      version: 1,
      workouts: [{ no_id: 123 }],
      exercises: [],
      sets: []
    };
    expect(backupService.validateBackup(corruptedWorkout).isValid).toBe(false);
  });
});

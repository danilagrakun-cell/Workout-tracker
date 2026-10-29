import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SetRow } from '../features/workouts/SetRow';
import { HomePage } from '../pages/HomePage';
import { WorkoutSet } from '../types';

describe('UI Components', () => {
  it('renders ConfirmDialog and responds to confirm and cancel events', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Удалить тренировку?"
        message="Все данные будут стёрты"
        confirmLabel="Да, удалить"
        cancelLabel="Отмена"
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByText('Удалить тренировку?')).toBeInTheDocument();
    expect(screen.getByText('Все данные будут стёрты')).toBeInTheDocument();

    const confirmBtn = screen.getByText('Да, удалить');
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByText('Отмена');
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('renders SetRow for strength exercise and updates inputs correctly', () => {
    const handleChange = vi.fn();
    const handleDelete = vi.fn();
    const handleCopy = vi.fn();

    const sampleSet: WorkoutSet = {
      id: 'set-1',
      exerciseId: 'ex-1',
      position: 1,
      weightKg: 50,
      reps: 10
    };

    render(
      <SetRow
        set={sampleSet}
        index={0}
        exerciseType="strength"
        onChange={handleChange}
        onDelete={handleDelete}
        onCopy={handleCopy}
        canCopy={true}
      />
    );

    const weightInput = screen.getByLabelText('Вес для подхода 1') as HTMLInputElement;
    expect(weightInput.value).toBe('50');

    const repsInput = screen.getByLabelText('Повторения для подхода 1') as HTMLInputElement;
    expect(repsInput.value).toBe('10');

    // Change weight
    fireEvent.change(weightInput, { target: { value: '55.5' } });
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        weightKg: 55.5
      })
    );

    // Click copy button
    const copyBtn = screen.getByLabelText('Копировать подход');
    fireEvent.click(copyBtn);
    expect(handleCopy).toHaveBeenCalledTimes(1);
  });

  it('renders HomePage empty state when no workouts are recorded', async () => {
    const handleNewWorkout = vi.fn();
    const handleView = vi.fn();
    const handleHistory = vi.fn();
    const handleProgress = vi.fn();

    render(
      <HomePage
        onNewWorkout={handleNewWorkout}
        onViewWorkout={handleView}
        onGoToHistory={handleHistory}
        onGoToProgress={handleProgress}
      />
    );

    expect(screen.getByText('Дневник тренировок')).toBeInTheDocument();
    expect(screen.getByText('Новая тренировка')).toBeInTheDocument();

    const newBtns = screen.getAllByText(/Новая тренировка/i);
    fireEvent.click(newBtns[0]);
    expect(handleNewWorkout).toHaveBeenCalled();
  });
});

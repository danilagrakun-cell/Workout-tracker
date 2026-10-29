import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  History,
  TrendingUp,
  Dumbbell,
  ArrowRight,
  Flame
} from 'lucide-react';
import { WorkoutWithDetails } from '../types';
import { workoutService } from '../features/workouts/workoutService';
import {
  formatDate,
  getWorkoutTypeLabel,
  getTodayDateString
} from '../utils/formatters';
import { calculateExercisesVolume } from '../features/progress/progressService';

interface HomePageProps {
  onNewWorkout: () => void;
  onViewWorkout: (id: string) => void;
  onGoToHistory: () => void;
  onGoToProgress: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNewWorkout,
  onViewWorkout,
  onGoToHistory,
  onGoToProgress
}) => {
  const [lastWorkout, setLastWorkout] = useState<WorkoutWithDetails | null>(null);
  const [weekCount, setWeekCount] = useState<number>(0);
  const [monthCount, setMonthCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const [last, week, month, total] = await Promise.all([
        workoutService.getLastWorkout(),
        workoutService.getWorkoutsCountThisWeek(),
        workoutService.getWorkoutsCountThisMonth(),
        workoutService.getTotalWorkoutsCount()
      ]);
      setLastWorkout(last);
      setWeekCount(week);
      setMonthCount(month);
      setTotalCount(total);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = getTodayDateString();

  return (
    <div className="page-container home-page">
      {/* Date & Welcome Banner */}
      <div className="home-hero-card">
        <div className="home-hero-date">
          <Calendar size={15} />
          <span>{formatDate(todayStr)}</span>
        </div>
        <h2 className="home-hero-title">Дневник тренировок</h2>
        <p className="home-hero-subtitle">
          Фиксируй результаты каждого подхода и достигай новых целей
        </p>

        {/* Primary CTA */}
        <button
          type="button"
          className="btn btn-primary btn-lg btn-block hero-cta-btn"
          onClick={onNewWorkout}
        >
          <Plus size={22} strokeWidth={2.5} />
          <span>Новая тренировка</span>
        </button>
      </div>

      {/* Weekly Stats Bar */}
      <div className="stats-metric-row">
        <div className="metric-box">
          <div className="metric-header">
            <Flame size={16} className="metric-icon flame" />
            <span className="metric-label">На этой неделе</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{weekCount}</span>
            <span className="metric-unit">трен.</span>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-header">
            <Calendar size={16} className="metric-icon calendar" />
            <span className="metric-label">В этом месяце</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{monthCount}</span>
            <span className="metric-unit">трен.</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="quick-links-grid">
        <button
          type="button"
          className="quick-card-btn"
          onClick={onGoToHistory}
        >
          <div className="quick-card-icon history-icon">
            <History size={20} />
          </div>
          <div className="quick-card-info">
            <span className="quick-card-title">История</span>
            <span className="quick-card-desc">Всего записей: {totalCount}</span>
          </div>
          <ArrowRight size={18} className="quick-card-arrow" />
        </button>

        <button
          type="button"
          className="quick-card-btn"
          onClick={onGoToProgress}
        >
          <div className="quick-card-icon progress-icon">
            <TrendingUp size={20} />
          </div>
          <div className="quick-card-info">
            <span className="quick-card-title">Прогресс</span>
            <span className="quick-card-desc">Рабочие веса и тоннаж</span>
          </div>
          <ArrowRight size={18} className="quick-card-arrow" />
        </button>
      </div>

      {/* Last Workout Section */}
      <div className="home-section">
        <div className="section-header-flex">
          <h3 className="section-title">Последняя тренировка</h3>
          {lastWorkout && (
            <button
              type="button"
              className="text-link-btn"
              onClick={onGoToHistory}
            >
              Вся история →
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading-state">Загрузка данных...</div>
        ) : lastWorkout ? (
          <div
            className="card last-workout-card"
            onClick={() => onViewWorkout(lastWorkout.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onViewWorkout(lastWorkout.id);
            }}
          >
            <div className="last-workout-header">
              <div>
                <span className={`workout-type-pill ${lastWorkout.type}`}>
                  {getWorkoutTypeLabel(lastWorkout.type)}
                </span>
                <h4 className="last-workout-title">{lastWorkout.title}</h4>
              </div>
              <span className="last-workout-date">{formatDate(lastWorkout.date)}</span>
            </div>

            {/* Exercises mini preview */}
            <div className="last-workout-ex-list">
              {lastWorkout.exercises.slice(0, 3).map((ex) => (
                <div key={ex.id} className="last-workout-ex-pill">
                  <span className="dot">•</span>
                  <span>{ex.name}</span>
                  <span className="sets-count">({ex.sets.length} подх.)</span>
                </div>
              ))}
              {lastWorkout.exercises.length > 3 && (
                <span className="more-exercises-badge">
                  +{lastWorkout.exercises.length - 3} ещё
                </span>
              )}
            </div>

            <div className="last-workout-footer">
              <div className="footer-metric">
                <span className="footer-label">Упражнений:</span>
                <span className="footer-val">{lastWorkout.exercises.length}</span>
              </div>
              <div className="footer-metric">
                <span className="footer-label">Подходов:</span>
                <span className="footer-val">
                  {lastWorkout.exercises.reduce((acc, e) => acc + e.sets.length, 0)}
                </span>
              </div>
              {calculateExercisesVolume(lastWorkout.exercises) > 0 && (
                <div className="footer-metric">
                  <span className="footer-label">Объём:</span>
                  <span className="footer-val highlight">
                    {calculateExercisesVolume(lastWorkout.exercises)} кг
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="card home-empty-state">
            <div className="empty-icon-circle">
              <Dumbbell size={32} />
            </div>
            <h4 className="empty-state-title">Здесь пока пусто</h4>
            <p className="empty-state-desc">
              Вы ещё не записали ни одной тренировки. Начните прямо сейчас — выберите упражнения и зафиксируйте рабочие веса!
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onNewWorkout}
            >
              <Plus size={18} />
              <span>Создать первую тренировку</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

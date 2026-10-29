import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  BarChart2,
  Calendar,
  Flame,
  Info,
  Dumbbell
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  progressService,
  ExerciseDataPoint,
  VolumeDataPoint,
  OverallStats
} from '../features/progress/progressService';
import { formatDate } from '../utils/formatters';

export const ProgressPage: React.FC = () => {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [trackedExercises, setTrackedExercises] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [exerciseData, setExerciseData] = useState<ExerciseDataPoint[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllProgress();
  }, []);

  useEffect(() => {
    if (selectedExercise) {
      loadExerciseData(selectedExercise);
    }
  }, [selectedExercise]);

  const loadAllProgress = async () => {
    setLoading(true);
    try {
      const [overall, names, volumes] = await Promise.all([
        progressService.getOverallStats(),
        progressService.getTrackedExerciseNames(),
        progressService.getVolumeHistory(15)
      ]);

      setStats(overall);
      setTrackedExercises(names);
      setVolumeData(volumes);

      if (names.length > 0) {
        setSelectedExercise(names[0]);
        const exPoints = await progressService.getExerciseProgress(names[0]);
        setExerciseData(exPoints);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadExerciseData = async (name: string) => {
    const points = await progressService.getExerciseProgress(name);
    setExerciseData(points);
  };

  return (
    <div className="page-container progress-page">
      {/* Header */}
      <div className="page-header-box">
        <h2 className="page-title">Спортивный прогресс</h2>
        <p className="page-subtitle">Локальная аналитика рабочих весов и тренировочного объёма</p>
      </div>

      {loading ? (
        <div className="loading-state">Расчёт статистики тренировок...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stats-metric-row mb-3">
            <div className="metric-box">
              <div className="metric-header">
                <Flame size={16} className="metric-icon flame" />
                <span className="metric-label">Всего тренировок</span>
              </div>
              <div className="metric-value-row">
                <span className="metric-number">{stats?.totalWorkouts ?? 0}</span>
                <span className="metric-unit">за всё время</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-header">
                <Calendar size={16} className="metric-icon calendar" />
                <span className="metric-label">Этот месяц</span>
              </div>
              <div className="metric-value-row">
                <span className="metric-number">{stats?.monthWorkouts ?? 0}</span>
                <span className="metric-unit">тренировок</span>
              </div>
            </div>
          </div>

          <div className="stats-metric-row mb-4">
            <div className="metric-box">
              <div className="metric-header">
                <Dumbbell size={16} className="metric-icon" />
                <span className="metric-label">Общий тоннаж</span>
              </div>
              <div className="metric-value-row">
                <span className="metric-number">
                  {stats ? (stats.totalVolumeKg >= 1000 ? `${(stats.totalVolumeKg / 1000).toFixed(1)} т` : `${stats.totalVolumeKg} кг`) : '0 кг'}
                </span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-header">
                <Award size={16} className="metric-icon" />
                <span className="metric-label">Всего подходов</span>
              </div>
              <div className="metric-value-row">
                <span className="metric-number">{stats?.totalSets ?? 0}</span>
                <span className="metric-unit">подходов</span>
              </div>
            </div>
          </div>

          {/* Exercise Progression Section */}
          <div className="card chart-card mb-4">
            <div className="chart-card-header">
              <div className="flex-align gap-2">
                <TrendingUp size={20} className="chart-title-icon" />
                <h3 className="chart-title">Прогресс в упражнении</h3>
              </div>
            </div>

            {trackedExercises.length === 0 ? (
              <div className="chart-insufficient-data">
                <Info size={24} className="info-icon" />
                <p className="chart-info-text">
                  Вы пока не записали ни одного упражнения с рабочим весом. Сохраните тренировку, чтобы отслеживать динамику!
                </p>
              </div>
            ) : (
              <>
                <div className="form-group mb-3">
                  <label htmlFor="exercise-select" className="form-label">
                    Выберите упражнение для анализа:
                  </label>
                  <select
                    id="exercise-select"
                    className="select-field"
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                  >
                    {trackedExercises.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {exerciseData.length < 2 ? (
                  <div className="chart-insufficient-data">
                    <Info size={24} className="info-icon" />
                    <div>
                      <p className="chart-info-text bold">
                        {exerciseData.length === 1
                          ? 'Для отображения графика требуется минимум 2 тренировки с этим упражнением.'
                          : 'Нет данных по выбранному упражнению.'}
                      </p>
                      {exerciseData.length === 1 && (
                        <p className="chart-subinfo-text">
                          Зафиксировано {formatDate(exerciseData[0].date)}: {exerciseData[0].maxWeightKg} кг × {exerciseData[0].maxReps} повт. (1RM ≈ {exerciseData[0].estimated1RM} кг).
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Max Weight Line Chart */}
                    <p className="chart-subtitle-text">Максимальный рабочий вес (кг):</p>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={exerciseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(val) => {
                              const parts = val.split('-');
                              return parts.length === 3 ? `${parts[2]}.${parts[1]}` : val;
                            }}
                            stroke="var(--text-muted)"
                            fontSize={12}
                          />
                          <YAxis stroke="var(--text-muted)" fontSize={12} domain={['auto', 'auto']} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--border-color)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                            formatter={(value: any, name: any) => [
                              `${value} кг`,
                              name === 'maxWeightKg' ? 'Макс. вес' : name === 'estimated1RM' ? '1RM (расчёт)' : name
                            ]}
                            labelFormatter={(label) => `Дата: ${formatDate(String(label))}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="maxWeightKg"
                            name="maxWeightKg"
                            stroke="#38bdf8"
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#38bdf8' }}
                            activeDot={{ r: 7 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="estimated1RM"
                            name="estimated1RM"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={{ r: 3, fill: '#f59e0b' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-legend-row">
                      <div className="legend-item">
                        <span className="legend-dot weight" />
                        <span>Рабочий вес (кг)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot onerm" />
                        <span>Расчётный 1RM (кг)</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Volume by Workout Bar Chart */}
          <div className="card chart-card mb-4">
            <div className="chart-card-header">
              <div className="flex-align gap-2">
                <BarChart2 size={20} className="chart-title-icon" />
                <h3 className="chart-title">Объём нагрузки по тренировкам (кг)</h3>
              </div>
            </div>

            {volumeData.filter((v) => v.volumeKg > 0).length < 2 ? (
              <div className="chart-insufficient-data">
                <Info size={24} className="info-icon" />
                <p className="chart-info-text">
                  Недостаточно данных для графика объёма. Завершите как минимум две силовые тренировки с заполненными весами и повторениями.
                </p>
              </div>
            ) : (
              <div>
                <p className="chart-subtitle-text">
                  Суммарный тоннаж (вес × повторения) за последние тренировки:
                </p>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.6} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(val) => {
                          const parts = val.split('-');
                          return parts.length === 3 ? `${parts[2]}.${parts[1]}` : val;
                        }}
                        stroke="var(--text-muted)"
                        fontSize={12}
                      />
                      <YAxis stroke="var(--text-muted)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--border-color)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)'
                        }}
                        formatter={(val: any) => [`${val} кг`, 'Тоннаж']}
                        labelFormatter={(label) => `Дата: ${formatDate(String(label))}`}
                      />
                      <Bar dataKey="volumeKg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

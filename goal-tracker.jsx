import React, { useState, useEffect } from 'react';
import { Calendar, Check, Target, TrendingUp, Plus, Trash2, Edit2, X, ChevronLeft, ChevronRight } from 'lucide-react';

const GoalTrackerApp = () => {
  // State Management
  const [habits, setHabits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalType, setModalType] = useState('habit');
  const [editingGoal, setEditingGoal] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    current: 0,
    target: 100,
    unit: ''
  });

  // Load data from persistent storage on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveAllData();
    }
  }, [habits, tasks, progress]);

  // Persistent Storage Functions
  const loadAllData = async () => {
    try {
      const [habitsData, tasksData, progressData] = await Promise.all([
        window.storage.get('goals_habits'),
        window.storage.get('goals_tasks'),
        window.storage.get('goals_progress')
      ]);

      if (habitsData?.value) setHabits(JSON.parse(habitsData.value));
      if (tasksData?.value) setTasks(JSON.parse(tasksData.value));
      if (progressData?.value) setProgress(JSON.parse(progressData.value));
      
      setIsLoading(false);
    } catch (error) {
      console.log('No saved data found, starting fresh');
      setIsLoading(false);
    }
  };

  const saveAllData = async () => {
    try {
      await Promise.all([
        window.storage.set('goals_habits', JSON.stringify(habits)),
        window.storage.set('goals_tasks', JSON.stringify(tasks)),
        window.storage.set('goals_progress', JSON.stringify(progress))
      ]);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Utility Functions
  const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthStart = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Habit Functions
  const addHabit = () => {
    const newHabit = {
      id: generateId(),
      name: formData.name,
      description: formData.description,
      completedDates: {},
      createdAt: new Date().toISOString()
    };
    setHabits([...habits, newHabit]);
    closeModal();
  };

  const toggleHabitDay = (habitId, date) => {
    const dateKey = getDateKey(date);
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const newCompleted = { ...habit.completedDates };
        if (newCompleted[dateKey]) {
          delete newCompleted[dateKey];
        } else {
          newCompleted[dateKey] = true;
        }
        return { ...habit, completedDates: newCompleted };
      }
      return habit;
    }));
  };

  const getHabitStats = (habit, month) => {
    const daysInMonth = getDaysInMonth(month);
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    
    let completed = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum, day);
      const dateKey = getDateKey(date);
      if (habit.completedDates[dateKey]) completed++;
    }
    
    return { completed, total: daysInMonth };
  };

  // Task Functions
  const addTask = () => {
    const newTask = {
      id: generateId(),
      name: formData.name,
      description: formData.description,
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, newTask]);
    closeModal();
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // Progress Functions
  const addProgress = () => {
    const newProgress = {
      id: generateId(),
      name: formData.name,
      description: formData.description,
      current: parseFloat(formData.current) || 0,
      target: parseFloat(formData.target) || 100,
      unit: formData.unit || '',
      createdAt: new Date().toISOString()
    };
    setProgress([...progress, newProgress]);
    closeModal();
  };

  const updateProgress = (progressId, newCurrent) => {
    setProgress(progress.map(p => 
      p.id === progressId ? { ...p, current: parseFloat(newCurrent) } : p
    ));
  };

  // Edit Functions
  const startEdit = (goal, type) => {
    setEditingGoal(goal);
    setModalType(type);
    setFormData({
      name: goal.name,
      description: goal.description || '',
      current: goal.current || 0,
      target: goal.target || 100,
      unit: goal.unit || ''
    });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (modalType === 'habit') {
      setHabits(habits.map(h => 
        h.id === editingGoal.id ? { ...h, name: formData.name, description: formData.description } : h
      ));
    } else if (modalType === 'task') {
      setTasks(tasks.map(t => 
        t.id === editingGoal.id ? { ...t, name: formData.name, description: formData.description } : t
      ));
    } else if (modalType === 'progress') {
      setProgress(progress.map(p => 
        p.id === editingGoal.id ? { 
          ...p, 
          name: formData.name, 
          description: formData.description,
          target: parseFloat(formData.target) || 100,
          unit: formData.unit || ''
        } : p
      ));
    }
    setShowEditModal(false);
    setEditingGoal(null);
  };

  // Delete Functions
  const deleteGoal = (id, type) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    if (type === 'habit') {
      setHabits(habits.filter(h => h.id !== id));
    } else if (type === 'task') {
      setTasks(tasks.filter(t => t.id !== id));
    } else if (type === 'progress') {
      setProgress(progress.filter(p => p.id !== id));
    }
  };

  // Modal Functions
  const openAddModal = (type) => {
    setModalType(type);
    setFormData({
      name: '',
      description: '',
      current: 0,
      target: 100,
      unit: ''
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingGoal(null);
    setFormData({
      name: '',
      description: '',
      current: 0,
      target: 100,
      unit: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    if (modalType === 'habit') addHabit();
    else if (modalType === 'task') addTask();
    else if (modalType === 'progress') addProgress();
  };

  // Navigation
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Render Components
  const renderDashboard = () => {
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalHabitCompletions = habits.reduce((acc, habit) => {
      const stats = getHabitStats(habit, currentMonth);
      return acc + stats.completed;
    }, 0);
    const avgProgress = progress.length > 0 
      ? Math.round(progress.reduce((acc, p) => acc + (p.current / p.target * 100), 0) / progress.length)
      : 0;

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Goal Tracker</h1>
          <p className="text-gray-600">Track your habits, tasks, and progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Habits Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-blue-600" size={32} />
              <span className="text-3xl font-bold text-blue-600">{habits.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Habits</h3>
            <p className="text-sm text-gray-600">{totalHabitCompletions} completions this month</p>
          </div>

          {/* Tasks Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <Check className="text-green-600" size={32} />
              <span className="text-3xl font-bold text-green-600">{completedTasks}/{tasks.length}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Tasks</h3>
            <p className="text-sm text-gray-600">{tasks.length > 0 ? Math.round(completedTasks / tasks.length * 100) : 0}% complete</p>
          </div>

          {/* Progress Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-purple-600" size={32} />
              <span className="text-3xl font-bold text-purple-600">{avgProgress}%</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Progress Goals</h3>
            <p className="text-sm text-gray-600">{progress.length} active goals</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <button
            onClick={() => setActiveTab('habits')}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-4 font-semibold transition-all transform hover:scale-105"
          >
            View Habits →
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className="bg-green-500 hover:bg-green-600 text-white rounded-xl p-4 font-semibold transition-all transform hover:scale-105"
          >
            View Tasks →
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl p-4 font-semibold transition-all transform hover:scale-105"
          >
            View Progress →
          </button>
        </div>
      </div>
    );
  };

  const renderCalendar = (habit) => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const monthStart = getMonthStart(currentMonth);
    const days = [];
    const stats = getHabitStats(habit, currentMonth);

    // Empty cells for days before month starts
    for (let i = 0; i < monthStart; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateKey = getDateKey(date);
      const isCompleted = habit.completedDates[dateKey];
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => toggleHabitDay(habit.id, date)}
          className={`aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-all transform hover:scale-110 ${
            isCompleted
              ? 'bg-blue-500 text-white shadow-lg'
              : isToday
              ? 'bg-blue-100 text-blue-600 border-2 border-blue-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800">{habit.name}</h3>
            {habit.description && (
              <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => startEdit(habit, 'habit')}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => deleteGoal(habit.id, 'habit')}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-2xl font-bold text-blue-600">
              {stats.completed}/{stats.total}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(stats.completed / stats.total * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${stats.completed / stats.total * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const renderHabits = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Habit Tracker</h2>
        <button
          onClick={() => openAddModal('habit')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all transform hover:scale-105"
        >
          <Plus size={20} />
          Add Habit
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h3 className="text-xl font-semibold text-gray-800 min-w-[200px] text-center">
          {formatMonthYear(currentMonth)}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={24} />
        </button>
        {currentMonth.getMonth() !== new Date().getMonth() && (
          <button
            onClick={goToToday}
            className="ml-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
          >
            Today
          </button>
        )}
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600 text-lg mb-4">No habits yet. Start tracking today!</p>
          <button
            onClick={() => openAddModal('habit')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Add Your First Habit
          </button>
        </div>
      ) : (
        habits.map(habit => renderCalendar(habit))
      )}
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Task Checklist</h2>
        <button
          onClick={() => openAddModal('task')}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all transform hover:scale-105"
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16">
          <Check className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600 text-lg mb-4">No tasks yet. Add your first task!</p>
          <button
            onClick={() => openAddModal('task')}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Add Your First Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`bg-white rounded-xl p-6 shadow-lg border-2 transition-all ${
                task.completed ? 'border-green-300 bg-green-50' : 'border-green-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  {task.completed && <Check className="text-white" size={20} />}
                </button>
                
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${
                    task.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                  }`}>
                    {task.name}
                  </h3>
                  {task.description && (
                    <p className={`text-sm mt-1 ${
                      task.completed ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(task, 'task')}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => deleteGoal(task.id, 'task')}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Progress Goals</h2>
        <button
          onClick={() => openAddModal('progress')}
          className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all transform hover:scale-105"
        >
          <Plus size={20} />
          Add Goal
        </button>
      </div>

      {progress.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600 text-lg mb-4">No progress goals yet. Start tracking!</p>
          <button
            onClick={() => openAddModal('progress')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Add Your First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {progress.map(p => {
            const percentage = Math.min(Math.round(p.current / p.target * 100), 100);
            
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">{p.name}</h3>
                    {p.description && (
                      <p className="text-sm text-gray-600 mt-1">{p.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(p, 'progress')}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteGoal(p.id, 'progress')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-3xl font-bold text-purple-600">
                      {p.current} {p.unit}
                    </span>
                    <span className="text-gray-600">
                      of {p.target} {p.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-purple-500 h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 15 && (
                        <span className="text-white text-xs font-bold">{percentage}%</span>
                      )}
                    </div>
                  </div>
                  {percentage <= 15 && (
                    <div className="text-right mt-1">
                      <span className="text-sm font-semibold text-purple-600">{percentage}%</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    value={p.current}
                    onChange={(e) => updateProgress(p.id, e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    min="0"
                    max={p.target}
                    step="0.1"
                  />
                  <button
                    onClick={() => updateProgress(p.id, Math.min(p.current + 1, p.target))}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
                  >
                    +1
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderModal = (isEdit = false) => {
    const show = isEdit ? showEditModal : showAddModal;
    if (!show) return null;

    const title = isEdit ? 'Edit ' : 'Add New ';
    const typeLabel = modalType === 'habit' ? 'Habit' : modalType === 'task' ? 'Task' : 'Progress Goal';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">{title}{typeLabel}</h3>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={isEdit ? (e) => { e.preventDefault(); saveEdit(); } : handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Morning Exercise, Read a Book"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                rows="3"
                placeholder="Additional details..."
              />
            </div>

            {modalType === 'progress' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target *
                    </label>
                    <input
                      type="number"
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      min="1"
                      step="0.1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="pages, km, etc."
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold transition-colors ${
                  modalType === 'habit'
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : modalType === 'task'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                {isEdit ? 'Save Changes' : 'Add Goal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Target className="inline mr-2" size={20} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'habits'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="inline mr-2" size={20} />
            Habits
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'tasks'
                ? 'bg-green-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Check className="inline mr-2" size={20} />
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'progress'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="inline mr-2" size={20} />
            Progress
          </button>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'habits' && renderHabits()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'progress' && renderProgress()}

        {/* Modals */}
        {renderModal(false)}
        {renderModal(true)}
      </div>
    </div>
  );
};

export default GoalTrackerApp;

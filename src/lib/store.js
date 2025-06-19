import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => {
        localStorage.setItem('authToken', token);
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        localStorage.removeItem('authToken');
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export const useAppStore = create((set, get) => ({
  // UI State
  sidebarOpen: true,
  currentPage: 'dashboard',
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentPage: (page) => set({ currentPage: page }),
  
  // Task Status
  activeTasks: {},
  
  addActiveTask: (taskId, taskData) => {
    set((state) => ({
      activeTasks: {
        ...state.activeTasks,
        [taskId]: taskData,
      },
    }));
  },
  
  updateActiveTask: (taskId, updates) => {
    set((state) => ({
      activeTasks: {
        ...state.activeTasks,
        [taskId]: {
          ...state.activeTasks[taskId],
          ...updates,
        },
      },
    }));
  },
  
  removeActiveTask: (taskId) => {
    set((state) => {
      const newTasks = { ...state.activeTasks };
      delete newTasks[taskId];
      return { activeTasks: newTasks };
    });
  },
  
  // Notifications
  notifications: [],
  
  addNotification: (notification) => {
    const id = Date.now().toString();
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id, ...notification, timestamp: new Date() },
      ],
    }));
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      get().removeNotification(id);
    }, 5000);
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));


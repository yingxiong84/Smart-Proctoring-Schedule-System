import { Teacher, Schedule, Assignment, SpecialTask, HistoricalStats } from '../types';

interface AppData {
  teachers: Teacher[];
  schedules: Schedule[];
  assignments: Assignment[];
  specialTasks: SpecialTask;
  historicalStats: HistoricalStats;
  lastModified: string;
  version: string;
}

class StorageManager {
  private readonly STORAGE_KEY = 'scheduling-app-data';
  private readonly VERSION = '1.0.0';

  // Save data to localStorage with compression
  saveData(data: Partial<AppData>): void {
    try {
      const fullData: AppData = {
        teachers: [],
        schedules: [],
        assignments: [],
        specialTasks: { designated: [], forced: [] },
        historicalStats: {},
        ...data,
        lastModified: new Date().toISOString(),
        version: this.VERSION
      };

      const compressed = this.compressData(JSON.stringify(fullData));
      localStorage.setItem(this.STORAGE_KEY, compressed);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // Load data from localStorage with decompression
  loadData(): AppData | null {
    try {
      const compressed = localStorage.getItem(this.STORAGE_KEY);
      if (!compressed) return null;

      const decompressed = this.decompressData(compressed);
      const data = JSON.parse(decompressed) as AppData;

      // Version migration if needed
      if (data.version !== this.VERSION) {
        return this.migrateData(data);
      }

      return data;
    } catch (error) {
      console.error('Failed to load data:', error);
      return null;
    }
  }

  // Export data to file
  exportData(data: AppData, filename?: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `scheduling-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Import data from file
  async importData(file: File): Promise<AppData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as AppData;
          
          // Validate data structure
          if (this.validateData(data)) {
            resolve(data);
          } else {
            reject(new Error('Invalid data format'));
          }
        } catch (error) {
          reject(new Error('Failed to parse file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Clear all stored data
  clearData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Auto-save functionality
  enableAutoSave(getData: () => Partial<AppData>, interval = 30000): () => void {
    const autoSaveInterval = setInterval(() => {
      this.saveData(getData());
    }, interval);

    return () => clearInterval(autoSaveInterval);
  }

  private compressData(data: string): string {
    // Simple compression - in production, consider using a proper compression library
    return btoa(encodeURIComponent(data));
  }

  private decompressData(compressed: string): string {
    return decodeURIComponent(atob(compressed));
  }

  private validateData(data: any): data is AppData {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.teachers) &&
      Array.isArray(data.schedules) &&
      Array.isArray(data.assignments) &&
      data.specialTasks &&
      typeof data.historicalStats === 'object'
    );
  }

  private migrateData(data: AppData): AppData {
    // Handle version migrations here
    return {
      ...data,
      version: this.VERSION
    };
  }
}

export const storageManager = new StorageManager();

// React hook for using storage
export const useStorage = () => {
  const saveData = (data: Partial<AppData>) => {
    storageManager.saveData(data);
  };

  const loadData = () => {
    return storageManager.loadData();
  };

  const exportData = (data: AppData, filename?: string) => {
    storageManager.exportData(data, filename);
  };

  const importData = async (file: File) => {
    return storageManager.importData(file);
  };

  const clearData = () => {
    storageManager.clearData();
  };

  return {
    saveData,
    loadData,
    exportData,
    importData,
    clearData
  };
};
import axios, { AxiosInstance } from 'axios';
import { TickTickTask, TickTickProject, TickTickConfig } from './types.js';

// Helper function to enhance task display with readable priority
function enhanceTaskForDisplay(task: TickTickTask): any {
  const enhanced = { ...task };
  
  // Add human-readable priority
  let priorityText = 'None';
  switch (task.priority) {
    case 0:
      priorityText = 'None';
      break;
    case 1:
      priorityText = 'Low';
      break;
    case 3:
      priorityText = 'Medium';
      break;
    case 5:
      priorityText = 'High';
      break;
    default:
      priorityText = task.priority ? `Custom (${task.priority})` : 'None';
  }
  
  return {
    ...enhanced,
    priorityText,
    // Keep original dates for display - they should show correctly
    dueDate: task.dueDate
  };
}

// Helper function to check if a task is due today
function isTaskDueToday(task: TickTickTask): boolean {
  // If task is completed, it's not due today
  if (task.completedTime) {
    return false;
  }
  
  // If no due date, it's not due today
  if (!task.dueDate) {
    return false;
  }
  
  try {
    // Get current date/time
    const now = new Date();
    
    // Parse due date and add 1 day to compensate for timezone difference
    const dueDate = new Date(task.dueDate);
    const adjustedDueDate = new Date(dueDate.getTime() + (24 * 60 * 60 * 1000)); // Add 1 day
    
    // If it's an all-day task, compare dates only
    if (task.allDay) {
      const today = now.toISOString().split('T')[0];
      const adjustedDueDateStr = adjustedDueDate.toISOString().split('T')[0];
      
      // Task is due today if adjusted due date equals today
      return adjustedDueDateStr === today;
    }
    
    // For timed tasks, check if it's due today (same date)
    const today = now.toISOString().split('T')[0];
    const adjustedDueDateStr = adjustedDueDate.toISOString().split('T')[0];
    return adjustedDueDateStr === today;
  } catch (error) {
    // If date parsing fails, assume not due today
    return false;
  }
}

// Helper function to check if a task is overdue with D+1 adjustment
function isTaskOverdue(task: TickTickTask, timezoneOffsetHours: number = 8): boolean {
  // If task is completed, it's not overdue
  if (task.completedTime) {
    return false;
  }
  
  // If no due date, it's not overdue
  if (!task.dueDate) {
    return false;
  }
  
  try {
    // Get current date/time
    const now = new Date();
    
    // Parse due date and add 1 day to compensate for timezone difference
    const dueDate = new Date(task.dueDate);
    const adjustedDueDate = new Date(dueDate.getTime() + (24 * 60 * 60 * 1000)); // Add 1 day
    
    // If it's an all-day task, compare dates only
    if (task.allDay) {
      // Get today's date in YYYY-MM-DD format
      const today = now.toISOString().split('T')[0];
      const adjustedDueDateStr = adjustedDueDate.toISOString().split('T')[0];
      
      // Task is overdue if adjusted due date is before today
      return adjustedDueDateStr < today;
    }
    
    // For timed tasks, compare datetime directly
    return adjustedDueDate < now;
  } catch (error) {
    // If date parsing fails, assume not overdue
    return false;
  }
}

export class TickTickClient {
  private client: AxiosInstance;
  private sessionId: string | null = null;
  private config: TickTickConfig;

  constructor(config: TickTickConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: 'https://api.ticktick.com/open/v1',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TickTick-MCP-Server/1.0.0'
      }
    });

    // If access token is provided, set it immediately
    if (config.accessToken) {
      this.sessionId = config.accessToken;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${config.accessToken}`;
    }
  }

  async authenticate(): Promise<void> {
    try {
      const response = await this.client.post('/user/signon', {
        username: this.config.username,
        password: this.config.password
      });

      if (response.data && response.data.token) {
        this.sessionId = response.data.token;
        this.client.defaults.headers.common['Authorization'] = `Bearer ${this.sessionId}`;
      } else {
        throw new Error('Authentication failed: No token received');
      }
    } catch (error) {
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        const errorData = axiosError.response?.data ? JSON.stringify(axiosError.response.data) : axiosError.message;
        throw new Error(`Authentication failed: ${axiosError.response?.status} ${axiosError.response?.statusText} - ${errorData}`);
      }
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.sessionId) {
      if (this.config.accessToken) {
        this.sessionId = this.config.accessToken;
        this.client.defaults.headers.common['Authorization'] = `Bearer ${this.config.accessToken}`;
      } else if (this.config.username && this.config.password) {
        await this.authenticate();
      } else {
        throw new Error('Either accessToken or username/password must be provided');
      }
    }
  }

  async getTasks(projectId?: string): Promise<TickTickTask[]> {
    await this.ensureAuthenticated();
    
    try {
      if (projectId) {
        // Get tasks from a specific project using project data endpoint
        const response = await this.client.get(`/project/${projectId}/data`);
        const tasks = response.data?.tasks || [];
        return tasks.map((task: TickTickTask) => enhanceTaskForDisplay(task));
      } else {
        // Get all tasks by getting all projects and their tasks
        const projects = await this.getProjects();
        const allTasks: TickTickTask[] = [];
        
        for (const project of projects) {
          try {
            // Some special handling may be needed for inbox project
            const projectResponse = await this.client.get(`/project/${project.id}/data`);
            const projectTasks = projectResponse.data?.tasks || [];
            allTasks.push(...projectTasks);
          } catch (error) {
            // Skip projects that can't be accessed, but log more details
            console.warn(`Could not access tasks for project ${project.id} (${project.name}):`, error);
          }
        }
        
        // Also try to get inbox tasks specifically if inbox wasn't included
        try {
          const inboxResponse = await this.client.get('/project/inbox/data');
          const inboxTasks = inboxResponse.data?.tasks || [];
          allTasks.push(...inboxTasks);
        } catch (error) {
          // Inbox might not be accessible this way, try alternative
          try {
            const inboxResponse = await this.client.get('/task?projectId=inbox');
            const inboxTasks = inboxResponse.data || [];
            allTasks.push(...inboxTasks);
          } catch (inboxError) {
            console.warn('Could not access inbox tasks:', inboxError);
          }
        }
        
        return allTasks.map(task => enhanceTaskForDisplay(task));
      }
    } catch (error) {
      // Log more detailed error information
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        const errorData = axiosError.response?.data ? JSON.stringify(axiosError.response.data) : axiosError.message;
        throw new Error(`Failed to get tasks: ${axiosError.response?.status} ${axiosError.response?.statusText} - ${errorData}`);
      }
      throw new Error(`Failed to get tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getOverdueTasks(projectId?: string, timezoneOffsetHours: number = 8): Promise<any[]> {
    // Get raw tasks for filtering logic
    const allTasks = await this.getTasksRaw(projectId);
    const overdueTasks = allTasks.filter(task => isTaskOverdue(task, timezoneOffsetHours));
    return overdueTasks.map(task => enhanceTaskForDisplay(task));
  }

  async getTodaysTasks(projectId?: string): Promise<any[]> {
    // Get raw tasks for filtering logic
    const allTasks = await this.getTasksRaw(projectId);
    const todaysTasks = allTasks.filter(task => isTaskDueToday(task));
    return todaysTasks.map(task => enhanceTaskForDisplay(task));
  }

  // Raw version without display enhancement for internal filtering
  private async getTasksRaw(projectId?: string): Promise<TickTickTask[]> {
    await this.ensureAuthenticated();
    
    try {
      if (projectId) {
        const response = await this.client.get(`/project/${projectId}/data`);
        return response.data?.tasks || [];
      } else {
        const projects = await this.getProjects();
        const allTasks: TickTickTask[] = [];
        
        for (const project of projects) {
          try {
            const projectResponse = await this.client.get(`/project/${project.id}/data`);
            const projectTasks = projectResponse.data?.tasks || [];
            allTasks.push(...projectTasks);
          } catch (error) {
            console.warn(`Could not access tasks for project ${project.id} (${project.name}):`, error);
          }
        }
        
        // Also try to get inbox tasks specifically
        try {
          const inboxResponse = await this.client.get('/project/inbox/data');
          const inboxTasks = inboxResponse.data?.tasks || [];
          allTasks.push(...inboxTasks);
        } catch (error) {
          try {
            const inboxResponse = await this.client.get('/task?projectId=inbox');
            const inboxTasks = inboxResponse.data || [];
            allTasks.push(...inboxTasks);
          } catch (inboxError) {
            console.warn('Could not access inbox tasks:', inboxError);
          }
        }
        
        return allTasks;
      }
    } catch (error) {
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        const errorData = axiosError.response?.data ? JSON.stringify(axiosError.response.data) : axiosError.message;
        throw new Error(`Failed to get tasks: ${axiosError.response?.status} ${axiosError.response?.statusText} - ${errorData}`);
      }
      throw new Error(`Failed to get tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProjects(): Promise<TickTickProject[]> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.client.get('/project');
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to get projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createTask(task: Partial<TickTickTask>): Promise<TickTickTask> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.client.post('/task', task);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateTask(taskId: string, updates: Partial<TickTickTask>): Promise<TickTickTask> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.client.post(`/task/${taskId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteTask(taskId: string, projectId: string): Promise<void> {
    await this.ensureAuthenticated();
    
    try {
      await this.client.delete(`/project/${projectId}/task/${taskId}`);
    } catch (error) {
      throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async completeTask(taskId: string, projectId: string): Promise<TickTickTask> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.client.post(`/project/${projectId}/task/${taskId}/complete`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to complete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTaskById(taskId: string, projectId: string): Promise<TickTickTask> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.client.get(`/project/${projectId}/task/${taskId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
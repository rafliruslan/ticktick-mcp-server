import { z } from 'zod';

export const TickTickTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().optional(),
  desc: z.string().optional(),
  allDay: z.boolean().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  timeZone: z.string().optional(),
  isFloating: z.boolean().optional(),
  reminder: z.string().optional(),
  reminders: z.array(z.object({
    id: z.string(),
    trigger: z.string()
  })).optional(),
  exDate: z.array(z.string()).optional(),
  completedTime: z.string().optional(),
  completedUserId: z.string().optional(),
  createdTime: z.string().optional(),
  creator: z.string().optional(),
  etag: z.string().optional(),
  modifiedTime: z.string().optional(),
  projectId: z.string(),
  sortOrder: z.number().optional(),
  status: z.number().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.number().optional(),
  progress: z.number().optional(),
  assignee: z.string().optional(),
  isDirty: z.boolean().optional(),
  local: z.boolean().optional(),
  repeatFlag: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    title: z.string(),
    status: z.number().optional(),
    completedTime: z.string().optional(),
    isAllDay: z.boolean().optional(),
    sortOrder: z.number().optional(),
    startDate: z.string().optional(),
    timeZone: z.string().optional()
  })).optional()
});

export const TickTickProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  inAll: z.boolean().optional(),
  sortOrder: z.number().optional(),
  sortType: z.string().optional(),
  userCount: z.number().optional(),
  etag: z.string().optional(),
  modifiedTime: z.string().optional(),
  closed: z.boolean().optional(),
  muted: z.boolean().optional(),
  transferred: z.boolean().optional(),
  groupId: z.string().optional(),
  viewMode: z.string().optional(),
  notificationOptions: z.object({
    beMentioned: z.boolean().optional(),
    newTaskAssignedToMe: z.boolean().optional(),
    newTaskCreated: z.boolean().optional(),
    taskCompleted: z.boolean().optional(),
    taskDeleted: z.boolean().optional(),
    taskUpdated: z.boolean().optional()
  }).optional(),
  teamId: z.string().optional(),
  permission: z.string().optional(),
  kind: z.string().optional()
});

export type TickTickTask = z.infer<typeof TickTickTaskSchema>;
export type TickTickProject = z.infer<typeof TickTickProjectSchema>;

export interface TickTickConfig {
  username?: string;
  password?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}
#!/usr/bin/env node

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { TickTickClient } from './ticktick-client.js';
import { TickTickConfig } from './types.js';

class TickTickMCPServer {
  private server: Server;
  private ticktickClient: TickTickClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'ticktick-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_tasks',
            description: 'Get all tasks or tasks from a specific project',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Optional project ID to filter tasks',
                },
              },
            },
          },
          {
            name: 'get_overdue_tasks',
            description: 'Get all overdue tasks (incomplete tasks past their due date)',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Optional project ID to filter overdue tasks',
                },
                timezoneOffsetHours: {
                  type: 'number',
                  description: 'Timezone offset in hours from UTC (e.g., 8 for UTC+8). Defaults to 8',
                },
              },
            },
          },
          {
            name: 'get_todays_tasks',
            description: 'Get tasks that are specifically due today',
            inputSchema: {
              type: 'object',
              properties: {
                projectId: {
                  type: 'string',
                  description: 'Optional project ID to filter today\'s tasks',
                },
              },
            },
          },
          {
            name: 'get_projects',
            description: 'Get all projects from TickTick',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'create_task',
            description: 'Create a new task in TickTick',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Task title (required)',
                },
                content: {
                  type: 'string',
                  description: 'Task description/content',
                },
                projectId: {
                  type: 'string',
                  description: 'Project ID where the task should be created',
                },
                dueDate: {
                  type: 'string',
                  description: 'Due date in ISO format',
                },
                priority: {
                  type: 'number',
                  description: 'Task priority (0=None, 1=Low, 3=Medium, 5=High)',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Task tags',
                },
              },
              required: ['title'],
            },
          },
          {
            name: 'update_task',
            description: 'Update an existing task',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'string',
                  description: 'Task ID to update (required)',
                },
                title: {
                  type: 'string',
                  description: 'New task title',
                },
                content: {
                  type: 'string',
                  description: 'New task description/content',
                },
                dueDate: {
                  type: 'string',
                  description: 'New due date in ISO format',
                },
                priority: {
                  type: 'number',
                  description: 'New task priority (0=None, 1=Low, 3=Medium, 5=High)',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'New task tags',
                },
              },
              required: ['taskId'],
            },
          },
          {
            name: 'delete_task',
            description: 'Delete a task',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'string',
                  description: 'Task ID to delete (required)',
                },
                projectId: {
                  type: 'string',
                  description: 'Project ID containing the task (required)',
                },
              },
              required: ['taskId', 'projectId'],
            },
          },
          {
            name: 'complete_task',
            description: 'Mark a task as completed',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'string',
                  description: 'Task ID to complete (required)',
                },
                projectId: {
                  type: 'string',
                  description: 'Project ID containing the task (required)',
                },
              },
              required: ['taskId', 'projectId'],
            },
          },
          {
            name: 'get_task',
            description: 'Get a specific task by ID',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'string',
                  description: 'Task ID to retrieve (required)',
                },
                projectId: {
                  type: 'string',
                  description: 'Project ID containing the task (required)',
                },
              },
              required: ['taskId', 'projectId'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        await this.ensureClientInitialized();

        switch (name) {
          case 'get_tasks':
            const tasks = await this.ticktickClient!.getTasks(args?.projectId as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tasks, null, 2),
                },
              ],
            };

          case 'get_overdue_tasks':
            const timezoneOffsetHours = args?.timezoneOffsetHours as number || 8;
            const overdueTasks = await this.ticktickClient!.getOverdueTasks(args?.projectId as string, timezoneOffsetHours);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(overdueTasks, null, 2),
                },
              ],
            };

          case 'get_todays_tasks':
            const todaysTasks = await this.ticktickClient!.getTodaysTasks(args?.projectId as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(todaysTasks, null, 2),
                },
              ],
            };

          case 'get_projects':
            const projects = await this.ticktickClient!.getProjects();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(projects, null, 2),
                },
              ],
            };

          case 'create_task':
            if (!args?.title) {
              throw new McpError(ErrorCode.InvalidParams, 'Title is required');
            }
            const newTask = await this.ticktickClient!.createTask(args);
            return {
              content: [
                {
                  type: 'text',
                  text: `Task created successfully: ${JSON.stringify(newTask, null, 2)}`,
                },
              ],
            };

          case 'update_task':
            if (!args?.taskId) {
              throw new McpError(ErrorCode.InvalidParams, 'Task ID is required');
            }
            const updatedTask = await this.ticktickClient!.updateTask(args.taskId as string, args);
            return {
              content: [
                {
                  type: 'text',
                  text: `Task updated successfully: ${JSON.stringify(updatedTask, null, 2)}`,
                },
              ],
            };

          case 'delete_task':
            if (!args?.taskId || !args?.projectId) {
              throw new McpError(ErrorCode.InvalidParams, 'Task ID and Project ID are required');
            }
            await this.ticktickClient!.deleteTask(args.taskId as string, args.projectId as string);
            return {
              content: [
                {
                  type: 'text',
                  text: 'Task deleted successfully',
                },
              ],
            };

          case 'complete_task':
            if (!args?.taskId || !args?.projectId) {
              throw new McpError(ErrorCode.InvalidParams, 'Task ID and Project ID are required');
            }
            const completedTask = await this.ticktickClient!.completeTask(args.taskId as string, args.projectId as string);
            return {
              content: [
                {
                  type: 'text',
                  text: `Task completed successfully: ${JSON.stringify(completedTask, null, 2)}`,
                },
              ],
            };

          case 'get_task':
            if (!args?.taskId || !args?.projectId) {
              throw new McpError(ErrorCode.InvalidParams, 'Task ID and Project ID are required');
            }
            const task = await this.ticktickClient!.getTaskById(args.taskId as string, args.projectId as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(task, null, 2),
                },
              ],
            };

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async ensureClientInitialized(): Promise<void> {
    if (!this.ticktickClient) {
      const accessToken = process.env.TICKTICK_ACCESS_TOKEN;
      const username = process.env.TICKTICK_USERNAME;
      const password = process.env.TICKTICK_PASSWORD;
      const clientId = process.env.TICKTICK_CLIENT_ID;
      const clientSecret = process.env.TICKTICK_CLIENT_SECRET;
      const refreshToken = process.env.TICKTICK_REFRESH_TOKEN;

      if (!accessToken && (!username || !password)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Either TICKTICK_ACCESS_TOKEN or TICKTICK_USERNAME/TICKTICK_PASSWORD environment variables are required'
        );
      }

      const config: TickTickConfig = {
        accessToken,
        username,
        password,
        clientId,
        clientSecret,
        refreshToken
      };
      this.ticktickClient = new TickTickClient(config);
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('TickTick MCP server running on stdio');
  }
}

const server = new TickTickMCPServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
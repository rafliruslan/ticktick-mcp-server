# TickTick MCP Server

A Model Context Protocol (MCP) server that provides integration with TickTick task management service.

## Features

- List tasks and projects
- Create, update, and delete tasks
- Mark tasks as completed
- Get specific task details
- Full TypeScript support with proper error handling

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment configuration:
```bash
cp .env.example .env
```

3. Edit `.env` with your TickTick credentials:
```
TICKTICK_USERNAME=your_ticktick_username
TICKTICK_PASSWORD=your_ticktick_password
```

4. Build the project:
```bash
npm run build
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Available Tools

- `get_tasks` - Get all tasks or tasks from a specific project
- `get_projects` - Get all projects from TickTick
- `create_task` - Create a new task
- `update_task` - Update an existing task
- `delete_task` - Delete a task
- `complete_task` - Mark a task as completed
- `get_task` - Get a specific task by ID

## MCP Integration

Add this server to your MCP client configuration:

```json
{
  "servers": {
    "ticktick": {
      "command": "node",
      "args": ["/path/to/ticktick-mcp-server/dist/index.js"],
      "env": {
        "TICKTICK_USERNAME": "your_username",
        "TICKTICK_PASSWORD": "your_password"
      }
    }
  }
}
```

## License

MIT
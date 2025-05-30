# TickTick MCP Server

[![smithery badge](https://smithery.ai/badge/@rafliruslan/ticktick-mcp-server)](https://smithery.ai/server/@rafliruslan/ticktick-mcp-server)

A Model Context Protocol (MCP) server that provides integration with TickTick task management service.

## Features

- List tasks and projects with enhanced display (human-readable priorities)
- Create, update, and delete tasks
- Mark tasks as completed
- Get specific task details
- Timezone handling with manual D+1 adjustment for accurate due date calculations
- Get overdue tasks with configurable timezone offset
- Get today's tasks with proper timezone compensation
- OAuth and username/password authentication support
- Full TypeScript support with proper error handling

## Setup

### Installing via Smithery

To install TickTick Task Management Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@rafliruslan/ticktick-mcp-server):

```bash
npx -y @smithery/cli install @rafliruslan/ticktick-mcp-server --client claude
```

1. Install dependencies:
```bash
npm install
```

2. Create environment configuration:
```bash
cp .env.example .env
```

3. Configure authentication in `.env`:

**Option A: OAuth (Recommended)**
```env
TICKTICK_ACCESS_TOKEN=your_oauth_access_token
TICKTICK_REFRESH_TOKEN=your_refresh_token
TICKTICK_CLIENT_ID=your_client_id
TICKTICK_CLIENT_SECRET=your_client_secret
```

**Option B: Username/Password**
```env
TICKTICK_USERNAME=your_ticktick_username
TICKTICK_PASSWORD=your_ticktick_password
```

For OAuth setup, see [OAUTH_SETUP.md](./OAUTH_SETUP.md) or use the helper:
```bash
node oauth-helper.js
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

- `get_tasks` - Get all tasks or tasks from a specific project (with enhanced display)
- `get_overdue_tasks` - Get overdue tasks with timezone compensation (configurable offset, defaults to UTC+8 - adjust for your timezone)
- `get_todays_tasks` - Get tasks due today with D+1 timezone adjustment
- `get_projects` - Get all projects from TickTick
- `create_task` - Create a new task with priority, tags, due dates
- `update_task` - Update an existing task
- `delete_task` - Delete a task
- `complete_task` - Mark a task as completed
- `get_task` - Get a specific task by ID

### Timezone Handling

This server includes **manual timezone workarounds** to handle TickTick's timezone inconsistencies:

- **D+1 Adjustment**: Due dates are automatically adjusted by adding 1 day to compensate for timezone differences
- **Configurable Offset**: `get_overdue_tasks` accepts a `timezoneOffsetHours` parameter 
  - **Default**: 8 (UTC+8) - **Change this for your timezone!**
  - **Examples**: 
    - `timezoneOffsetHours: -5` for EST (UTC-5)
    - `timezoneOffsetHours: 0` for UTC
    - `timezoneOffsetHours: 9` for JST (UTC+9)
    - `timezoneOffsetHours: 1` for CET (UTC+1)
- **All-day vs Timed Tasks**: Different handling for all-day tasks vs specific time tasks
- **Enhanced Display**: Tasks include human-readable priority text (`None`, `Low`, `Medium`, `High`)

**Important**: The default timezone offset is set to UTC+8. Make sure to specify your correct timezone offset when calling `get_overdue_tasks` to get accurate results for your location.

## MCP Integration

### Claude Desktop (with Claude Desktop app)

Add this server to your MCP client configuration file:

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "ticktick": {
      "command": "node",
      "args": ["/path/to/ticktick-mcp-server/dist/index.js"],
      "env": {
        "TICKTICK_ACCESS_TOKEN": "your_oauth_token",
        "TICKTICK_REFRESH_TOKEN": "your_refresh_token",
        "TICKTICK_CLIENT_ID": "your_client_id",
        "TICKTICK_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Cursor IDE

Add this server to your Cursor MCP configuration:

**Location:** Create/edit `.cursorrules` or Cursor settings for MCP servers

```json
{
  "mcp": {
    "servers": {
      "ticktick": {
        "command": "node",
        "args": ["/path/to/ticktick-mcp-server/dist/index.js"],
        "env": {
          "TICKTICK_ACCESS_TOKEN": "your_oauth_token",
          "TICKTICK_REFRESH_TOKEN": "your_refresh_token", 
          "TICKTICK_CLIENT_ID": "your_client_id",
          "TICKTICK_CLIENT_SECRET": "your_client_secret"
        }
      }
    }
  }
}
```

### Alternative with Username/Password

```json
{
  "env": {
    "TICKTICK_USERNAME": "your_username",
    "TICKTICK_PASSWORD": "your_password"
  }
}
```

## License

MIT

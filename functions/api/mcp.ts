import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface MCPServer {
  id: string;
  name: string;
  server_url: string;
  capabilities: string[];
  status: 'connected' | 'disconnected' | 'error';
  created_at: string;
  user_id: string;
}

interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  server_id: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Extract user ID from JWT (simplified for demo)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const userId = 'demo-user'; // In real implementation, decode JWT

    // Connect to MCP server
    if (path === '/api/mcp/connect' && method === 'POST') {
      const body = await req.json();
      const { server_url, name, capabilities } = body;

      if (!server_url || !name || !capabilities) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: server_url, name, capabilities' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Simulate MCP server connection
      const mcpServer: MCPServer = {
        id: `mcp_${Date.now()}`,
        name,
        server_url,
        capabilities,
        status: 'connected',
        created_at: new Date().toISOString(),
        user_id: userId
      };

      // In real implementation, store in database
      console.log('MCP Server connected:', mcpServer);

      return new Response(JSON.stringify({
        success: true,
        server: mcpServer,
        message: `Successfully connected to MCP server: ${name}`
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // List MCP servers
    if (path === '/api/mcp/servers' && method === 'GET') {
      // Mock data for demo
      const servers: MCPServer[] = [
        {
          id: 'mcp_filesystem',
          name: 'File System Server',
          server_url: 'stdio://mcp-filesystem-server',
          capabilities: ['read_file', 'write_file', 'list_directory'],
          status: 'connected',
          created_at: '2024-01-15T10:00:00Z',
          user_id: userId
        },
        {
          id: 'mcp_database',
          name: 'Database Server',
          server_url: 'stdio://mcp-database-server',
          capabilities: ['query', 'schema_info', 'execute'],
          status: 'connected',
          created_at: '2024-01-15T11:00:00Z',
          user_id: userId
        }
      ];

      return new Response(JSON.stringify({
        servers,
        count: servers.length
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // List available tools for a server
    if (path === '/api/mcp/tools' && method === 'GET') {
      const serverName = url.searchParams.get('server_name');
      
      // Mock tools data
      const toolsMap: Record<string, MCPTool[]> = {
        'filesystem': [
          {
            name: 'read_file',
            description: 'Read contents of a file',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path to read' }
              },
              required: ['path']
            },
            server_id: 'mcp_filesystem'
          },
          {
            name: 'write_file',
            description: 'Write content to a file',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'File path to write' },
                content: { type: 'string', description: 'Content to write' }
              },
              required: ['path', 'content']
            },
            server_id: 'mcp_filesystem'
          },
          {
            name: 'list_directory',
            description: 'List contents of a directory',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Directory path to list' }
              },
              required: ['path']
            },
            server_id: 'mcp_filesystem'
          }
        ],
        'database': [
          {
            name: 'query',
            description: 'Execute a SQL query',
            parameters: {
              type: 'object',
              properties: {
                sql: { type: 'string', description: 'SQL query to execute' },
                params: { type: 'array', description: 'Query parameters' }
              },
              required: ['sql']
            },
            server_id: 'mcp_database'
          },
          {
            name: 'schema_info',
            description: 'Get database schema information',
            parameters: {
              type: 'object',
              properties: {
                table: { type: 'string', description: 'Table name (optional)' }
              }
            },
            server_id: 'mcp_database'
          }
        ]
      };

      const tools = serverName ? (toolsMap[serverName] || []) : 
        Object.values(toolsMap).flat();

      return new Response(JSON.stringify({
        tools,
        server_name: serverName,
        count: tools.length
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Execute MCP tool
    if (path === '/api/mcp/execute' && method === 'POST') {
      const body = await req.json();
      const { tool_name, parameters, server_id } = body;

      if (!tool_name || !server_id) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: tool_name, server_id' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Mock tool execution results
      const mockResults: Record<string, any> = {
        'read_file': {
          content: `// Example file content\nconst example = "Hello from MCP file system!";\nexport default example;`,
          size: 85,
          modified: '2024-01-15T12:00:00Z'
        },
        'write_file': {
          success: true,
          bytes_written: 42,
          path: parameters?.path || '/example/file.txt'
        },
        'list_directory': {
          files: [
            { name: 'file1.txt', type: 'file', size: 1024 },
            { name: 'folder1', type: 'directory', size: null },
            { name: 'file2.js', type: 'file', size: 2048 }
          ],
          path: parameters?.path || '/example'
        },
        'query': {
          rows: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
          ],
          count: 2,
          execution_time: '15ms'
        },
        'schema_info': {
          tables: [
            { name: 'users', columns: ['id', 'name', 'email', 'created_at'] },
            { name: 'conversations', columns: ['id', 'title', 'user_id', 'created_at'] }
          ]
        }
      };

      const result = mockResults[tool_name] || { 
        error: `Tool '${tool_name}' not implemented in mock` 
      };

      return new Response(JSON.stringify({
        success: !result.error,
        tool_name,
        parameters,
        result,
        execution_time: '25ms',
        server_id
      }), {
        status: result.error ? 400 : 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Disconnect MCP server
    if (path.startsWith('/api/mcp/servers/') && method === 'DELETE') {
      const serverId = path.split('/').pop();
      
      return new Response(JSON.stringify({
        success: true,
        message: `MCP server ${serverId} disconnected successfully`
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('MCP API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
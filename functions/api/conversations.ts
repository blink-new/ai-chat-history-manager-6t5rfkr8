import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  provider: string;
  created_at: string;
  updated_at: string;
  is_public: number;
  metadata?: string;
  mcp_server?: string;
  mcp_tools?: string[];
  message_count?: number;
  last_updated?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string;
  content: string;
  timestamp: string;
  provider_message_id?: string;
  metadata?: string;
  mcp_tool_calls?: Array<{
    tool: string;
    parameters: Record<string, any>;
    result?: any;
  }>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      },
    });
  }

  const url = new URL(req.url);
  const method = req.method;
  const pathSegments = url.pathname.split('/').filter(Boolean);

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    const apiKey = req.headers.get('X-API-Key');
    
    if (!authHeader && !apiKey) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Mock data for demonstration (replace with actual database queries)
    const mockConversations: Conversation[] = [
      {
        id: 'conv_1',
        user_id: 'user_123',
        title: 'React Best Practices Discussion',
        subject: 'React Development',
        provider: 'openai',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T11:45:00Z',
        last_updated: '2024-01-15T11:45:00Z',
        is_public: 1,
        message_count: 4,
        metadata: JSON.stringify({ tags: ['react', 'frontend', 'best-practices'] })
      },
      {
        id: 'conv_2',
        user_id: 'user_123',
        title: 'TypeScript Advanced Types',
        subject: 'TypeScript',
        provider: 'anthropic',
        created_at: '2024-01-16T14:20:00Z',
        updated_at: '2024-01-16T15:30:00Z',
        last_updated: '2024-01-16T15:30:00Z',
        is_public: 1,
        message_count: 6,
        metadata: JSON.stringify({ tags: ['typescript', 'types', 'advanced'] })
      },
      {
        id: 'conv_3',
        user_id: 'user_123',
        title: 'File System Code Review',
        subject: 'code-review',
        provider: 'mcp',
        created_at: '2024-01-17T09:15:00Z',
        updated_at: '2024-01-17T09:45:00Z',
        last_updated: '2024-01-17T09:45:00Z',
        is_public: 1,
        message_count: 3,
        mcp_server: 'filesystem',
        mcp_tools: ['read_file', 'write_file'],
        metadata: JSON.stringify({ tags: ['mcp', 'filesystem', 'code-review'] })
      },
      {
        id: 'conv_4',
        user_id: 'user_123',
        title: 'Database Query Optimization',
        subject: 'database-performance',
        provider: 'mcp',
        created_at: '2024-01-17T14:30:00Z',
        updated_at: '2024-01-17T15:00:00Z',
        last_updated: '2024-01-17T15:00:00Z',
        is_public: 1,
        message_count: 5,
        mcp_server: 'database',
        mcp_tools: ['query', 'schema_info'],
        metadata: JSON.stringify({ tags: ['mcp', 'database', 'optimization'] })
      },
      {
        id: 'conv_5',
        user_id: 'user_123',
        title: 'Web Search Integration',
        subject: 'web-search',
        provider: 'mcp',
        created_at: '2024-01-18T10:00:00Z',
        updated_at: '2024-01-18T10:30:00Z',
        last_updated: '2024-01-18T10:30:00Z',
        is_public: 1,
        message_count: 2,
        mcp_server: 'web-search',
        mcp_tools: ['search', 'fetch_url'],
        metadata: JSON.stringify({ tags: ['mcp', 'web-search', 'research'] })
      }
    ];

    const mockMessages: Message[] = [
      {
        id: 'msg_1',
        conversation_id: 'conv_1',
        user_id: 'user_123',
        role: 'user',
        content: 'What are the best practices for React component organization?',
        timestamp: '2024-01-15T10:30:00Z'
      },
      {
        id: 'msg_2',
        conversation_id: 'conv_1',
        user_id: 'user_123',
        role: 'assistant',
        content: 'Here are some key React component organization best practices:\n\n1. **Feature-based folder structure**: Organize components by features rather than by type\n2. **Single Responsibility Principle**: Each component should have one clear purpose\n3. **Composition over inheritance**: Use composition patterns for reusability',
        timestamp: '2024-01-15T10:31:00Z'
      },
      {
        id: 'msg_3',
        conversation_id: 'conv_3',
        user_id: 'user_123',
        role: 'user',
        content: 'Please review the Button component in /src/components/Button.tsx',
        timestamp: '2024-01-17T09:15:00Z'
      },
      {
        id: 'msg_4',
        conversation_id: 'conv_3',
        user_id: 'user_123',
        role: 'assistant',
        content: 'I\'ll read the Button component file and provide a comprehensive review.',
        timestamp: '2024-01-17T09:16:00Z',
        mcp_tool_calls: [
          {
            tool: 'read_file',
            parameters: { path: '/src/components/Button.tsx' },
            result: {
              content: 'import React from \'react\';\n\ninterface ButtonProps {\n  children: React.ReactNode;\n  onClick?: () => void;\n  variant?: \'primary\' | \'secondary\';\n}\n\nexport const Button: React.FC<ButtonProps> = ({ children, onClick, variant = \'primary\' }) => {\n  return (\n    <button\n      className={`btn btn-${variant}`}\n      onClick={onClick}\n    >\n      {children}\n    </button>\n  );\n};',
              size: 425
            }
          }
        ]
      },
      {
        id: 'msg_5',
        conversation_id: 'conv_4',
        user_id: 'user_123',
        role: 'user',
        content: 'Show me the database schema and help optimize slow queries',
        timestamp: '2024-01-17T14:30:00Z'
      },
      {
        id: 'msg_6',
        conversation_id: 'conv_4',
        user_id: 'user_123',
        role: 'assistant',
        content: 'I\'ll examine the database schema and identify optimization opportunities.',
        timestamp: '2024-01-17T14:31:00Z',
        mcp_tool_calls: [
          {
            tool: 'schema_info',
            parameters: {},
            result: {
              tables: [
                { name: 'users', columns: ['id', 'name', 'email', 'created_at'] },
                { name: 'conversations', columns: ['id', 'title', 'user_id', 'created_at'] },
                { name: 'messages', columns: ['id', 'conversation_id', 'content', 'timestamp'] }
              ]
            }
          }
        ]
      }
    ];

    // API Routes
    if (method === 'GET' && pathSegments.length === 0) {
      // GET /api/conversations - List all conversations
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const subject = url.searchParams.get('subject');
      const provider = url.searchParams.get('provider');

      let filteredConversations = mockConversations;
      
      if (subject) {
        filteredConversations = filteredConversations.filter(conv => 
          conv.subject.toLowerCase().includes(subject.toLowerCase())
        );
      }
      
      if (provider) {
        filteredConversations = filteredConversations.filter(conv => 
          conv.provider.toLowerCase() === provider.toLowerCase()
        );
      }

      const startIndex = (page - 1) * limit;
      const paginatedConversations = filteredConversations.slice(startIndex, startIndex + limit);

      return new Response(JSON.stringify({
        conversations: paginatedConversations,
        pagination: {
          page,
          limit,
          total: filteredConversations.length,
          totalPages: Math.ceil(filteredConversations.length / limit)
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (method === 'GET' && pathSegments.length === 1) {
      // GET /api/conversations/:id - Get specific conversation
      const conversationId = pathSegments[0];
      const conversation = mockConversations.find(conv => conv.id === conversationId);
      
      if (!conversation) {
        return new Response(JSON.stringify({ error: 'Conversation not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return new Response(JSON.stringify({ conversation }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (method === 'GET' && pathSegments.length === 2 && pathSegments[1] === 'messages') {
      // GET /api/conversations/:id/messages - Get messages for a conversation
      const conversationId = pathSegments[0];
      const conversationMessages = mockMessages.filter(msg => msg.conversation_id === conversationId);

      return new Response(JSON.stringify({
        messages: conversationMessages,
        conversation_id: conversationId
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (method === 'POST' && pathSegments.length === 0) {
      // POST /api/conversations - Create new conversation
      const body = await req.json();
      const newConversation: Conversation = {
        id: `conv_${Date.now()}`,
        user_id: body.user_id || 'user_123',
        title: body.title,
        subject: body.subject,
        provider: body.provider,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        is_public: body.is_public || 0,
        message_count: body.messages?.length || 0,
        mcp_server: body.mcp_server,
        mcp_tools: body.mcp_tools,
        metadata: body.metadata ? JSON.stringify(body.metadata) : undefined
      };

      return new Response(JSON.stringify({
        conversation: newConversation,
        message: 'Conversation created successfully'
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (method === 'GET' && pathSegments.length === 1 && pathSegments[0] === 'subjects') {
      // GET /api/conversations/subjects - Get all unique subjects
      const subjects = [...new Set(mockConversations.map(conv => conv.subject))];
      
      return new Response(JSON.stringify({ subjects }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (method === 'GET' && pathSegments.length === 1 && pathSegments[0] === 'providers') {
      // GET /api/conversations/providers - Get all unique providers
      const providers = [...new Set(mockConversations.map(conv => conv.provider))];
      
      return new Response(JSON.stringify({ providers }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Route not found
    return new Response(JSON.stringify({ error: 'Route not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
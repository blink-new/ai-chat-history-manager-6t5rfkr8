import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface MCPServer {
  id: string;
  name: string;
  server_url: string;
  capabilities: string[];
  status: 'connected' | 'disconnected' | 'error';
  created_at: string;
  user_id: string;
  provider_type?: string;
  config?: Record<string, any>;
}

interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  server_id: string;
  category: string;
  provider_specific?: boolean;
}

interface ChatHistoryExtraction {
  conversations: Array<{
    id: string;
    title: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
    created_at: string;
    updated_at: string;
  }>;
  metadata: {
    provider: string;
    extraction_method: string;
    total_conversations: number;
    extraction_timestamp: string;
  };
}

// Enhanced MCP tools for different providers
const PROVIDER_TOOLS: Record<string, MCPTool[]> = {
  'chatgpt': [
    {
      name: 'extract_chatgpt_conversations',
      description: 'Extract all conversations from ChatGPT web interface using DOM parsing',
      category: 'chat_extraction',
      server_id: 'chatgpt_extractor',
      provider_specific: true,
      parameters: {
        type: 'object',
        properties: {
          session_token: { type: 'string', description: 'ChatGPT session token' },
          max_conversations: { type: 'number', description: 'Maximum conversations to extract', default: 100 },
          include_archived: { type: 'boolean', description: 'Include archived conversations', default: false },
          date_range: {
            type: 'object',
            properties: {
              start_date: { type: 'string', format: 'date' },
              end_date: { type: 'string', format: 'date' }
            }
          }
        },
        required: ['session_token']
      }
    },
    {
      name: 'monitor_chatgpt_realtime',
      description: 'Monitor ChatGPT for new messages in real-time',
      category: 'real_time_monitoring',
      server_id: 'chatgpt_extractor',
      provider_specific: true,
      parameters: {
        type: 'object',
        properties: {
          session_token: { type: 'string', description: 'ChatGPT session token' },
          webhook_url: { type: 'string', description: 'Webhook URL for new message notifications' },
          polling_interval: { type: 'number', description: 'Polling interval in seconds', default: 30 }
        },
        required: ['session_token', 'webhook_url']
      }
    },
    {
      name: 'export_chatgpt_conversation',
      description: 'Export specific ChatGPT conversation with full formatting',
      category: 'data_export',
      server_id: 'chatgpt_extractor',
      provider_specific: true,
      parameters: {
        type: 'object',
        properties: {
          conversation_id: { type: 'string', description: 'ChatGPT conversation ID' },
          format: { type: 'string', enum: ['json', 'markdown', 'html'], default: 'json' },
          include_metadata: { type: 'boolean', default: true }
        },
        required: ['conversation_id']
      }
    }
  ],
  'claude': [
    {
      name: 'extract_claude_conversations',
      description: 'Extract conversations from Claude web interface',
      category: 'chat_extraction',
      server_id: 'claude_extractor',
      provider_specific: true,
      parameters: {
        type: 'object',
        properties: {
          session_cookie: { type: 'string', description: 'Claude session cookie' },
          organization_id: { type: 'string', description: 'Claude organization ID' },
          max_conversations: { type: 'number', default: 100 },
          include_artifacts: { type: 'boolean', description: 'Include Claude artifacts', default: true }
        },
        required: ['session_cookie']
      }
    },
    {
      name: 'monitor_claude_projects',
      description: 'Monitor Claude projects for new conversations',
      category: 'project_monitoring',
      server_id: 'claude_extractor',
      provider_specific: true,
      parameters: {
        type: 'object',
        properties: {
          session_cookie: { type: 'string', description: 'Claude session cookie' },
          project_ids: { type: 'array', items: { type: 'string' }, description: 'Project IDs to monitor' },
          webhook_url: { type: 'string', description: 'Webhook for notifications' }
        },
        required: ['session_cookie', 'webhook_url']
      }
    }
  ],
  'gemini': [
    {
      name: 'extract_gemini_conversations',
      description: 'Extract conversations from Google Gemini',
      category: 'chat_extraction',
      server_id: 'gemini_extractor',
      provider_specific: true,
      parameters: {
        type: 'object',
        properties: {
          google_session: { type: 'string', description: 'Google session token' },
          workspace_id: { type: 'string', description: 'Google Workspace ID (if applicable)' },
          max_conversations: { type: 'number', default: 100 },
          include_extensions: { type: 'boolean', description: 'Include Gemini extensions data', default: false }
        },
        required: ['google_session']
      }
    }
  ],
  'perplexity': [
    {
      name: 'extract_perplexity_conversations',
      description: 'Extract conversations from Perplexity AI',
      category: 'chat_extraction',
      server_id: 'perplexity_extractor',
      provider_specific: true,
      parameters: {
        type: 'object',
        properties: {
          auth_token: { type: 'string', description: 'Perplexity authentication token' },
          max_conversations: { type: 'number', default: 100 },
          include_sources: { type: 'boolean', description: 'Include source citations', default: true }
        },
        required: ['auth_token']
      }
    }
  ],
  'custom': [
    {
      name: 'extract_custom_provider',
      description: 'Generic extraction tool for custom AI providers',
      category: 'chat_extraction',
      server_id: 'custom_extractor',
      provider_specific: false,
      parameters: {
        type: 'object',
        properties: {
          provider_url: { type: 'string', description: 'Provider base URL' },
          auth_method: { type: 'string', enum: ['bearer', 'cookie', 'header', 'query'], default: 'bearer' },
          auth_value: { type: 'string', description: 'Authentication value' },
          extraction_config: {
            type: 'object',
            properties: {
              conversation_selector: { type: 'string', description: 'CSS selector for conversations' },
              message_selector: { type: 'string', description: 'CSS selector for messages' },
              title_selector: { type: 'string', description: 'CSS selector for conversation titles' }
            }
          }
        },
        required: ['provider_url', 'auth_value', 'extraction_config']
      }
    }
  ]
};

// Mock extraction results for different providers
const MOCK_EXTRACTION_RESULTS: Record<string, ChatHistoryExtraction> = {
  'chatgpt': {
    conversations: [
      {
        id: 'chatgpt_conv_1',
        title: 'Python Data Analysis Help',
        messages: [
          {
            role: 'user',
            content: 'Can you help me analyze a CSV file with pandas?',
            timestamp: '2024-01-15T10:00:00Z'
          },
          {
            role: 'assistant',
            content: 'I\'d be happy to help you analyze a CSV file with pandas! Here\'s a comprehensive approach...',
            timestamp: '2024-01-15T10:00:15Z'
          }
        ],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 'chatgpt_conv_2',
        title: 'React Component Design',
        messages: [
          {
            role: 'user',
            content: 'How do I create a reusable modal component in React?',
            timestamp: '2024-01-15T14:00:00Z'
          },
          {
            role: 'assistant',
            content: 'Creating a reusable modal component in React involves several key considerations...',
            timestamp: '2024-01-15T14:00:20Z'
          }
        ],
        created_at: '2024-01-15T14:00:00Z',
        updated_at: '2024-01-15T14:45:00Z'
      }
    ],
    metadata: {
      provider: 'chatgpt',
      extraction_method: 'web_scraping',
      total_conversations: 2,
      extraction_timestamp: '2024-01-15T16:00:00Z'
    }
  },
  'claude': {
    conversations: [
      {
        id: 'claude_conv_1',
        title: 'System Architecture Discussion',
        messages: [
          {
            role: 'user',
            content: 'I need help designing a microservices architecture for an e-commerce platform.',
            timestamp: '2024-01-15T11:00:00Z'
          },
          {
            role: 'assistant',
            content: 'I\'ll help you design a robust microservices architecture for your e-commerce platform...',
            timestamp: '2024-01-15T11:00:25Z'
          }
        ],
        created_at: '2024-01-15T11:00:00Z',
        updated_at: '2024-01-15T12:00:00Z'
      }
    ],
    metadata: {
      provider: 'claude',
      extraction_method: 'api_scraping',
      total_conversations: 1,
      extraction_timestamp: '2024-01-15T16:00:00Z'
    }
  }
};

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

    const userId = 'demo-user';

    // Get provider-specific tools
    if (path === '/api/mcp/provider-tools' && method === 'GET') {
      const provider = url.searchParams.get('provider');
      
      if (provider && PROVIDER_TOOLS[provider]) {
        return new Response(JSON.stringify({
          provider,
          tools: PROVIDER_TOOLS[provider],
          count: PROVIDER_TOOLS[provider].length
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Return all provider tools
      const allTools = Object.entries(PROVIDER_TOOLS).map(([provider, tools]) => ({
        provider,
        tools,
        count: tools.length
      }));

      return new Response(JSON.stringify({
        providers: allTools,
        total_tools: Object.values(PROVIDER_TOOLS).flat().length
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Execute chat history extraction
    if (path === '/api/mcp/extract-history' && method === 'POST') {
      const body = await req.json();
      const { provider, tool_name, parameters } = body;

      if (!provider || !tool_name) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: provider, tool_name' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Simulate extraction process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

      const extractionResult = MOCK_EXTRACTION_RESULTS[provider] || {
        conversations: [],
        metadata: {
          provider,
          extraction_method: 'unknown',
          total_conversations: 0,
          extraction_timestamp: new Date().toISOString()
        }
      };

      return new Response(JSON.stringify({
        success: true,
        provider,
        tool_name,
        parameters,
        extraction_result: extractionResult,
        processing_time: '2.1s'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Start real-time monitoring
    if (path === '/api/mcp/start-monitoring' && method === 'POST') {
      const body = await req.json();
      const { provider, tool_name, parameters } = body;

      return new Response(JSON.stringify({
        success: true,
        monitoring_id: `monitor_${provider}_${Date.now()}`,
        provider,
        tool_name,
        status: 'active',
        started_at: new Date().toISOString(),
        next_check: new Date(Date.now() + (parameters?.polling_interval || 30) * 1000).toISOString()
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Stop monitoring
    if (path === '/api/mcp/stop-monitoring' && method === 'POST') {
      const body = await req.json();
      const { monitoring_id } = body;

      return new Response(JSON.stringify({
        success: true,
        monitoring_id,
        status: 'stopped',
        stopped_at: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get extraction status
    if (path === '/api/mcp/extraction-status' && method === 'GET') {
      const provider = url.searchParams.get('provider');
      
      // Mock status data
      const statusData = {
        provider: provider || 'all',
        active_extractions: 2,
        completed_extractions: 15,
        failed_extractions: 1,
        last_extraction: '2024-01-15T15:30:00Z',
        next_scheduled: '2024-01-15T16:00:00Z',
        total_conversations_captured: 234,
        extraction_rate: '95.2%'
      };

      return new Response(JSON.stringify(statusData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Validate provider credentials
    if (path === '/api/mcp/validate-credentials' && method === 'POST') {
      const body = await req.json();
      const { provider, credentials } = body;

      // Simulate credential validation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const isValid = Math.random() > 0.3; // 70% success rate for demo

      return new Response(JSON.stringify({
        provider,
        valid: isValid,
        message: isValid ? 'Credentials validated successfully' : 'Invalid credentials or expired session',
        expires_at: isValid ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
        permissions: isValid ? ['read_conversations', 'monitor_sessions'] : []
      }), {
        status: isValid ? 200 : 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get supported providers
    if (path === '/api/mcp/supported-providers' && method === 'GET') {
      const providers = Object.keys(PROVIDER_TOOLS).map(provider => ({
        id: provider,
        name: provider.charAt(0).toUpperCase() + provider.slice(1),
        description: `Extract chat history from ${provider === 'custom' ? 'custom AI providers' : provider}`,
        tools_count: PROVIDER_TOOLS[provider].length,
        capabilities: PROVIDER_TOOLS[provider].map(tool => tool.category),
        auth_methods: provider === 'custom' ? ['bearer', 'cookie', 'header', 'query'] : ['session_token', 'cookie'],
        extraction_methods: ['web_scraping', 'dom_parsing', 'api_integration']
      }));

      return new Response(JSON.stringify({
        providers,
        total_providers: providers.length,
        total_tools: Object.values(PROVIDER_TOOLS).flat().length
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
    console.error('Enhanced MCP API Error:', error);
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
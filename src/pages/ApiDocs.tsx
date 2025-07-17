import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Code, Copy, ExternalLink, Zap } from 'lucide-react'
import { toast } from 'sonner'

export function ApiDocs() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    toast.success('Code copied to clipboard!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const endpoints = [
    {
      method: 'POST',
      path: '/api/conversations',
      description: 'Store a new conversation',
      params: ['title', 'provider', 'subject', 'messages'],
      example: `{
  "title": "Python Data Analysis Help",
  "provider": "openai",
  "subject": "data-science",
  "messages": [
    {
      "role": "user",
      "content": "How do I analyze CSV data with pandas?"
    },
    {
      "role": "assistant", 
      "content": "You can use pandas.read_csv()..."
    }
  ]
}`
    },
    {
      method: 'GET',
      path: '/api/conversations',
      description: 'Retrieve conversations with filtering',
      params: ['subject', 'provider', 'limit', 'offset'],
      example: `GET /api/conversations?subject=data-science&provider=openai&limit=10`
    },
    {
      method: 'POST',
      path: '/api/mcp/connect',
      description: 'Connect to an MCP server',
      params: ['server_url', 'name', 'capabilities'],
      example: `{
  "server_url": "stdio://path/to/mcp-server",
  "name": "File System Server",
  "capabilities": ["file_read", "file_write", "directory_list"]
}`
    },
    {
      method: 'GET',
      path: '/api/mcp/tools',
      description: 'List available MCP tools',
      params: ['server_name'],
      example: `GET /api/mcp/tools?server_name=filesystem`
    }
  ]

  const mcpExamples = [
    {
      title: 'File System Integration',
      description: 'Connect AI conversations to file operations',
      code: `// Connect to file system MCP server
const response = await fetch('/api/mcp/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    server_url: 'stdio://mcp-filesystem-server',
    name: 'filesystem',
    capabilities: ['read_file', 'write_file', 'list_directory']
  })
})

// Use in conversation
const conversation = {
  title: 'Code Review Session',
  provider: 'mcp',
  subject: 'code-review',
  mcp_tools: ['read_file', 'write_file'],
  messages: [
    {
      role: 'user',
      content: 'Please review the code in /src/components/Button.tsx'
    }
  ]
}`
    },
    {
      title: 'Database Integration',
      description: 'Query databases through MCP in conversations',
      code: `// Connect to database MCP server
const dbConnection = await fetch('/api/mcp/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    server_url: 'stdio://mcp-database-server',
    name: 'postgres',
    capabilities: ['query', 'schema_info']
  })
})

// Store conversation with database context
const conversation = {
  title: 'Database Optimization',
  provider: 'mcp',
  subject: 'database-performance',
  mcp_context: {
    server: 'postgres',
    schema: 'public'
  }
}`
    }
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Documentation</h1>
        <p className="text-gray-600">
          Complete API reference for the AI Chat History Manager with MCP integration
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="mcp">MCP Integration</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Getting Started
              </CardTitle>
              <CardDescription>
                The AI Chat History Manager API allows you to store, retrieve, and manage 
                conversations across multiple AI providers with MCP support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Base URL</h3>
                <code className="text-sm bg-white px-2 py-1 rounded border">
                  https://your-domain.com/api
                </code>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Authentication</h3>
                <p className="text-sm text-gray-600 mb-2">
                  All API requests require authentication using API keys.
                </p>
                <code className="text-sm bg-white px-2 py-1 rounded border">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">REST API</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Standard HTTP methods for CRUD operations
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">MCP Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Model Context Protocol integration for enhanced AI capabilities
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Real-time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      WebSocket support for live conversation updates
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          {endpoints.map((endpoint, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-base">{endpoint.path}</code>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(endpoint.example, `endpoint-${index}`)}
                  >
                    {copiedCode === `endpoint-${index}` ? (
                      'Copied!'
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>{endpoint.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Parameters</h4>
                    <div className="flex flex-wrap gap-2">
                      {endpoint.params.map((param) => (
                        <Badge key={param} variant="outline">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Example</h4>
                    <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                      <code>{endpoint.example}</code>
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="mcp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                MCP (Model Context Protocol) Integration
              </CardTitle>
              <CardDescription>
                Enhance your AI conversations with external tools and services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">What is MCP?</h3>
                <p className="text-blue-800 text-sm mb-3">
                  Model Context Protocol is a standard for connecting AI models to external tools, 
                  databases, and services. It enables AI to perform actions beyond text generation.
                </p>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href="https://modelcontextprotocol.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Learn more about MCP
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Supported MCP Servers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        File System Server
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Database Server (PostgreSQL, MySQL)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Web Search Server
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Git Repository Server
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Custom MCP Servers
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">MCP Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Tool execution in conversations</li>
                      <li>• Resource access (files, databases)</li>
                      <li>• Real-time data integration</li>
                      <li>• Custom prompt templates</li>
                      <li>• Server capability discovery</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          {mcpExamples.map((example, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{example.title}</CardTitle>
                    <CardDescription>{example.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(example.code, `example-${index}`)}
                  >
                    {copiedCode === `example-${index}` ? (
                      'Copied!'
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                  <code>{example.code}</code>
                </pre>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Complete Integration Example</CardTitle>
              <CardDescription>
                Full example of storing a conversation with MCP tool usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{`// 1. Connect MCP server
const mcpConnection = await fetch('/api/mcp/connect', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    server_url: 'stdio://mcp-filesystem-server',
    name: 'filesystem',
    capabilities: ['read_file', 'write_file', 'list_directory']
  })
})

// 2. Store conversation with MCP context
const conversation = await fetch('/api/conversations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Code Review with File Access',
    provider: 'mcp',
    subject: 'code-review',
    mcp_server: 'filesystem',
    messages: [
      {
        role: 'user',
        content: 'Please review the React component in /src/Button.tsx'
      },
      {
        role: 'assistant',
        content: 'I'll read the file and provide a review.',
        mcp_tool_calls: [
          {
            tool: 'read_file',
            parameters: { path: '/src/Button.tsx' }
          }
        ]
      }
    ]
  })
})

// 3. Retrieve conversations by subject
const relatedConversations = await fetch('/api/conversations?subject=code-review', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Switch } from '../components/ui/switch'
import { 
  Server, 
  Plus, 
  Trash2, 
  Play, 
  Square, 
  Settings, 
  Download, 
  Upload,
  MessageSquare,
  Bot,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Code,
  Database,
  FileText,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'

interface MCPServer {
  id: string
  name: string
  server_url: string
  capabilities: string[]
  status: 'connected' | 'disconnected' | 'error'
  created_at: string
  user_id: string
  provider_type?: string
  config?: Record<string, any>
}

interface MCPTool {
  name: string
  description: string
  parameters: Record<string, any>
  server_id: string
  category: string
}

interface ChatHistoryCapture {
  id: string
  provider: string
  status: 'running' | 'stopped' | 'error'
  last_capture: string | null
  conversations_captured: number
  tool_name: string
}

const PROVIDER_TEMPLATES = {
  'chatgpt': {
    name: 'ChatGPT History Extractor',
    description: 'Captures conversation history from ChatGPT web interface',
    capabilities: ['web_scraping', 'dom_parsing', 'session_management'],
    tools: [
      {
        name: 'extract_chatgpt_conversations',
        description: 'Extract conversations from ChatGPT web interface',
        category: 'chat_extraction'
      },
      {
        name: 'monitor_chatgpt_session',
        description: 'Monitor active ChatGPT session for new messages',
        category: 'real_time_monitoring'
      }
    ]
  },
  'claude': {
    name: 'Claude History Extractor',
    description: 'Captures conversation history from Claude web interface',
    capabilities: ['web_scraping', 'dom_parsing', 'session_management'],
    tools: [
      {
        name: 'extract_claude_conversations',
        description: 'Extract conversations from Claude web interface',
        category: 'chat_extraction'
      },
      {
        name: 'monitor_claude_session',
        description: 'Monitor active Claude session for new messages',
        category: 'real_time_monitoring'
      }
    ]
  },
  'gemini': {
    name: 'Gemini History Extractor',
    description: 'Captures conversation history from Google Gemini',
    capabilities: ['web_scraping', 'dom_parsing', 'session_management'],
    tools: [
      {
        name: 'extract_gemini_conversations',
        description: 'Extract conversations from Gemini web interface',
        category: 'chat_extraction'
      },
      {
        name: 'monitor_gemini_session',
        description: 'Monitor active Gemini session for new messages',
        category: 'real_time_monitoring'
      }
    ]
  },
  'perplexity': {
    name: 'Perplexity History Extractor',
    description: 'Captures conversation history from Perplexity AI',
    capabilities: ['web_scraping', 'dom_parsing', 'session_management'],
    tools: [
      {
        name: 'extract_perplexity_conversations',
        description: 'Extract conversations from Perplexity web interface',
        category: 'chat_extraction'
      }
    ]
  },
  'custom': {
    name: 'Custom Provider Extractor',
    description: 'Generic tool for custom AI provider integration',
    capabilities: ['web_scraping', 'api_integration', 'custom_parsing'],
    tools: [
      {
        name: 'extract_custom_conversations',
        description: 'Extract conversations from custom provider',
        category: 'chat_extraction'
      }
    ]
  }
}

export function MCPManager() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [tools, setTools] = useState<MCPTool[]>([])
  const [captures, setCaptures] = useState<ChatHistoryCapture[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [serverName, setServerName] = useState('')
  const [serverUrl, setServerUrl] = useState('')
  const [customConfig, setCustomConfig] = useState('')
  const [autoStart, setAutoStart] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load MCP servers
      const serversResponse = await blink.data.fetch({
        url: 'https://6t5rfkr8--mcp.functions.blink.new/api/mcp/servers',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      
      if (serversResponse.status === 200) {
        setServers(serversResponse.body.servers || [])
      }

      // Load available tools
      const toolsResponse = await blink.data.fetch({
        url: 'https://6t5rfkr8--mcp.functions.blink.new/api/mcp/tools',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      
      if (toolsResponse.status === 200) {
        setTools(toolsResponse.body.tools || [])
      }

      // Mock chat history captures data
      setCaptures([
        {
          id: 'capture_1',
          provider: 'chatgpt',
          status: 'running',
          last_capture: '2024-01-15T14:30:00Z',
          conversations_captured: 45,
          tool_name: 'extract_chatgpt_conversations'
        },
        {
          id: 'capture_2',
          provider: 'claude',
          status: 'stopped',
          last_capture: '2024-01-15T12:15:00Z',
          conversations_captured: 23,
          tool_name: 'extract_claude_conversations'
        }
      ])

    } catch (error) {
      console.error('Failed to load MCP data:', error)
      toast.error('Failed to load MCP data')
    } finally {
      setLoading(false)
    }
  }

  const createMCPServer = async () => {
    if (!selectedProvider || !serverName) {
      toast.error('Please select a provider and enter a server name')
      return
    }

    try {
      const template = PROVIDER_TEMPLATES[selectedProvider as keyof typeof PROVIDER_TEMPLATES]
      const config = customConfig ? JSON.parse(customConfig) : {}

      const response = await blink.data.fetch({
        url: 'https://6t5rfkr8--mcp.functions.blink.new/api/mcp/connect',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer demo-token'
        },
        body: {
          name: serverName,
          server_url: serverUrl || `mcp://${selectedProvider}-extractor`,
          capabilities: template.capabilities,
          provider_type: selectedProvider,
          config: {
            ...config,
            auto_start: autoStart,
            extraction_interval: 300000, // 5 minutes
            max_conversations: 1000
          }
        }
      })

      if (response.status === 201) {
        toast.success('MCP server created successfully')
        setShowCreateDialog(false)
        resetForm()
        loadData()
      }
    } catch (error) {
      console.error('Failed to create MCP server:', error)
      toast.error('Failed to create MCP server')
    }
  }

  const deleteMCPServer = async (serverId: string) => {
    try {
      const response = await blink.data.fetch({
        url: `https://6t5rfkr8--mcp.functions.blink.new/api/mcp/servers/${serverId}`,
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })

      if (response.status === 200) {
        toast.success('MCP server deleted successfully')
        loadData()
      }
    } catch (error) {
      console.error('Failed to delete MCP server:', error)
      toast.error('Failed to delete MCP server')
    }
  }

  const executeTool = async (toolName: string, serverId: string, parameters: any = {}) => {
    try {
      const response = await blink.data.fetch({
        url: 'https://6t5rfkr8--mcp.functions.blink.new/api/mcp/execute',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer demo-token'
        },
        body: {
          tool_name: toolName,
          server_id: serverId,
          parameters
        }
      })

      if (response.status === 200) {
        toast.success(`Tool ${toolName} executed successfully`)
        return response.body.result
      }
    } catch (error) {
      console.error('Failed to execute tool:', error)
      toast.error('Failed to execute tool')
    }
  }

  const toggleCaptureStatus = async (captureId: string, newStatus: 'running' | 'stopped') => {
    setCaptures(captures.map(capture => 
      capture.id === captureId 
        ? { ...capture, status: newStatus }
        : capture
    ))
    toast.success(`Capture ${newStatus === 'running' ? 'started' : 'stopped'}`)
  }

  const resetForm = () => {
    setSelectedProvider('')
    setServerName('')
    setServerUrl('')
    setCustomConfig('')
    setAutoStart(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'disconnected':
      case 'stopped':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'running':
        return 'bg-green-100 text-green-800'
      case 'disconnected':
      case 'stopped':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'chat_extraction':
        return <MessageSquare className="h-4 w-4" />
      case 'real_time_monitoring':
        return <Zap className="h-4 w-4" />
      case 'database':
        return <Database className="h-4 w-4" />
      case 'file_system':
        return <FileText className="h-4 w-4" />
      case 'web_api':
        return <Globe className="h-4 w-4" />
      default:
        return <Code className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">MCP Manager</h1>
            <p className="text-gray-600">
              Create and manage MCP tools to capture chat history from AI providers
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create MCP Server
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create MCP Server</DialogTitle>
                <DialogDescription>
                  Set up a new MCP server to capture chat history from AI providers
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="provider">AI Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an AI provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chatgpt">ChatGPT (OpenAI)</SelectItem>
                      <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                      <SelectItem value="gemini">Gemini (Google)</SelectItem>
                      <SelectItem value="perplexity">Perplexity AI</SelectItem>
                      <SelectItem value="custom">Custom Provider</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedProvider && (
                    <p className="text-sm text-gray-600 mt-1">
                      {PROVIDER_TEMPLATES[selectedProvider as keyof typeof PROVIDER_TEMPLATES]?.description}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="serverName">Server Name</Label>
                  <Input
                    id="serverName"
                    placeholder="e.g., ChatGPT Production Extractor"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="serverUrl">Server URL (Optional)</Label>
                  <Input
                    id="serverUrl"
                    placeholder="e.g., stdio://custom-mcp-server or ws://localhost:8080"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty to use default URL for selected provider
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoStart"
                    checked={autoStart}
                    onCheckedChange={setAutoStart}
                  />
                  <Label htmlFor="autoStart">Auto-start capture on creation</Label>
                </div>

                <div>
                  <Label htmlFor="customConfig">Custom Configuration (JSON)</Label>
                  <Textarea
                    id="customConfig"
                    placeholder='{"extraction_interval": 300000, "max_conversations": 1000}'
                    value={customConfig}
                    onChange={(e) => setCustomConfig(e.target.value)}
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Optional JSON configuration for advanced settings
                  </p>
                </div>

                {selectedProvider && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Available Tools</h4>
                    <div className="space-y-2">
                      {PROVIDER_TEMPLATES[selectedProvider as keyof typeof PROVIDER_TEMPLATES]?.tools.map((tool, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          {getCategoryIcon(tool.category)}
                          <span className="text-sm text-blue-800">{tool.name}</span>
                          <span className="text-xs text-blue-600">- {tool.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createMCPServer}>
                  Create Server
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="servers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="servers">MCP Servers</TabsTrigger>
          <TabsTrigger value="captures">Active Captures</TabsTrigger>
          <TabsTrigger value="tools">Available Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="servers" className="space-y-4">
          {servers.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No MCP Servers</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first MCP server to start capturing chat history
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create MCP Server
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servers.map((server) => (
                <Card key={server.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Server className="h-5 w-5" />
                          {server.name}
                        </CardTitle>
                        <CardDescription>
                          {server.provider_type && (
                            <Badge variant="outline" className="mr-2">
                              {server.provider_type}
                            </Badge>
                          )}
                          {server.server_url}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(server.status)}
                        <Badge className={getStatusColor(server.status)}>
                          {server.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Capabilities</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {server.capabilities.map((capability) => (
                            <Badge key={capability} variant="secondary" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Created: {new Date(server.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete MCP Server</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{server.name}"? 
                                This will stop all active captures and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMCPServer(server.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Server
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="captures" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {captures.map((capture) => (
              <Card key={capture.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        {capture.provider.toUpperCase()} Capture
                      </CardTitle>
                      <CardDescription>
                        Tool: {capture.tool_name}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(capture.status)}
                      <Badge className={getStatusColor(capture.status)}>
                        {capture.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Conversations</Label>
                        <p className="font-medium">{capture.conversations_captured}</p>
                      </div>
                      <div>
                        <Label>Last Capture</Label>
                        <p className="font-medium">
                          {capture.last_capture 
                            ? new Date(capture.last_capture).toLocaleTimeString()
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {capture.status === 'running' ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => toggleCaptureStatus(capture.id, 'stopped')}
                        >
                          <Square className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => toggleCaptureStatus(capture.id, 'running')}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getCategoryIcon(tool.category)}
                    {tool.name}
                  </CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Parameters</Label>
                      <div className="bg-gray-50 rounded p-3 mt-1">
                        <pre className="text-xs text-gray-700">
                          {JSON.stringify(tool.parameters, null, 2)}
                        </pre>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => executeTool(tool.name, tool.server_id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Execute Tool
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
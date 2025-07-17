import { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Progress } from '../components/ui/progress'
import { 
  Download, 
  Play, 
  Square, 
  RefreshCw,
  MessageSquare,
  Bot,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Settings,
  Database,
  Globe,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

interface Provider {
  id: string
  name: string
  description: string
  tools_count: number
  capabilities: string[]
  auth_methods: string[]
  extraction_methods: string[]
}

interface ExtractionResult {
  conversations: Array<{
    id: string
    title: string
    messages: Array<{
      role: 'user' | 'assistant'
      content: string
      timestamp: string
    }>
    created_at: string
    updated_at: string
  }>
  metadata: {
    provider: string
    extraction_method: string
    total_conversations: number
    extraction_timestamp: string
  }
}

interface ExtractionStatus {
  provider: string
  active_extractions: number
  completed_extractions: number
  failed_extractions: number
  last_extraction: string
  next_scheduled: string
  total_conversations_captured: number
  extraction_rate: string
}

export function ChatExtraction() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [extractionResults, setExtractionResults] = useState<ExtractionResult | null>(null)
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false)
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [validatedCredentials, setValidatedCredentials] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadProviders()
    loadExtractionStatus()
  }, [])

  const loadProviders = async () => {
    try {
      setLoading(true)
      const response = await blink.data.fetch({
        url: 'https://6t5rfkr8--mcp-enhanced.functions.blink.new/api/mcp/supported-providers',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      
      if (response.status === 200) {
        setProviders(response.body.providers || [])
      }
    } catch (error) {
      console.error('Failed to load providers:', error)
      toast.error('Failed to load providers')
    } finally {
      setLoading(false)
    }
  }

  const loadExtractionStatus = async () => {
    try {
      const response = await blink.data.fetch({
        url: 'https://6t5rfkr8--mcp-enhanced.functions.blink.new/api/mcp/extraction-status',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      
      if (response.status === 200) {
        setExtractionStatus(response.body)
      }
    } catch (error) {
      console.error('Failed to load extraction status:', error)
    }
  }

  const validateCredentials = async (provider: string, creds: Record<string, string>) => {
    try {
      const response = await blink.data.fetch({
        url: 'https://6t5rfkr8--mcp-enhanced.functions.blink.new/api/mcp/validate-credentials',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer demo-token'
        },
        body: {
          provider,
          credentials: creds
        }
      })
      
      if (response.status === 200) {
        setValidatedCredentials(prev => ({ ...prev, [provider]: response.body.valid }))
        if (response.body.valid) {
          toast.success(`${provider} credentials validated successfully`)
        } else {
          toast.error(`Invalid ${provider} credentials`)
        }
        return response.body.valid
      }
    } catch (error) {
      console.error('Failed to validate credentials:', error)
      toast.error('Failed to validate credentials')
      return false
    }
  }

  const startExtraction = async (provider: string) => {
    if (!validatedCredentials[provider]) {
      toast.error('Please validate credentials first')
      return
    }

    try {
      setExtracting(true)
      setExtractionProgress(0)
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExtractionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 500)

      const response = await blink.data.fetch({
        url: 'https://6t5rfkr8--mcp-enhanced.functions.blink.new/api/mcp/extract-history',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer demo-token'
        },
        body: {
          provider,
          tool_name: `extract_${provider}_conversations`,
          parameters: credentials[provider] || {}
        }
      })
      
      clearInterval(progressInterval)
      setExtractionProgress(100)
      
      if (response.status === 200) {
        setExtractionResults(response.body.extraction_result)
        toast.success(`Successfully extracted ${response.body.extraction_result.metadata.total_conversations} conversations from ${provider}`)
        loadExtractionStatus() // Refresh status
      }
    } catch (error) {
      console.error('Failed to extract history:', error)
      toast.error('Failed to extract chat history')
    } finally {
      setExtracting(false)
      setTimeout(() => setExtractionProgress(0), 2000)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'chatgpt':
        return <Bot className="h-5 w-5 text-green-600" />
      case 'claude':
        return <MessageSquare className="h-5 w-5 text-orange-600" />
      case 'gemini':
        return <Zap className="h-5 w-5 text-blue-600" />
      case 'perplexity':
        return <Globe className="h-5 w-5 text-purple-600" />
      default:
        return <Database className="h-5 w-5 text-gray-600" />
    }
  }

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'chat_extraction':
        return <MessageSquare className="h-4 w-4" />
      case 'real_time_monitoring':
        return <Zap className="h-4 w-4" />
      case 'project_monitoring':
        return <Eye className="h-4 w-4" />
      case 'data_export':
        return <Download className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const renderCredentialsForm = (provider: Provider) => {
    const getCredentialFields = (provider: Provider) => {
      switch (provider.id) {
        case 'chatgpt':
          return [
            { key: 'session_token', label: 'Session Token', type: 'password', placeholder: 'Your ChatGPT session token' },
            { key: 'max_conversations', label: 'Max Conversations', type: 'number', placeholder: '100' }
          ]
        case 'claude':
          return [
            { key: 'session_cookie', label: 'Session Cookie', type: 'password', placeholder: 'Your Claude session cookie' },
            { key: 'organization_id', label: 'Organization ID', type: 'text', placeholder: 'Optional organization ID' }
          ]
        case 'gemini':
          return [
            { key: 'google_session', label: 'Google Session', type: 'password', placeholder: 'Your Google session token' },
            { key: 'workspace_id', label: 'Workspace ID', type: 'text', placeholder: 'Optional workspace ID' }
          ]
        case 'perplexity':
          return [
            { key: 'auth_token', label: 'Auth Token', type: 'password', placeholder: 'Your Perplexity auth token' }
          ]
        case 'custom':
          return [
            { key: 'provider_url', label: 'Provider URL', type: 'url', placeholder: 'https://api.example.com' },
            { key: 'auth_value', label: 'Auth Value', type: 'password', placeholder: 'Authentication token/key' },
            { key: 'extraction_config', label: 'Extraction Config', type: 'textarea', placeholder: 'JSON configuration' }
          ]
        default:
          return []
      }
    }

    return (
      <div className="space-y-4">
        {getCredentialFields(provider).map((field) => (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label}</Label>
            {field.type === 'textarea' ? (
              <Textarea
                id={field.key}
                placeholder={field.placeholder}
                value={credentials[provider.id]?.[field.key] || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [provider.id]: {
                    ...prev[provider.id],
                    [field.key]: e.target.value
                  }
                }))}
                rows={3}
              />
            ) : (
              <Input
                id={field.key}
                type={field.type}
                placeholder={field.placeholder}
                value={credentials[provider.id]?.[field.key] || ''}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  [provider.id]: {
                    ...prev[provider.id],
                    [field.key]: e.target.value
                  }
                }))}
              />
            )}
          </div>
        ))}
        
        <div className="flex space-x-2">
          <Button 
            onClick={() => validateCredentials(provider.id, credentials[provider.id] || {})}
            variant="outline"
            className="flex-1"
          >
            <Shield className="h-4 w-4 mr-2" />
            Validate Credentials
          </Button>
          
          {validatedCredentials[provider.id] && (
            <Button 
              onClick={() => startExtraction(provider.id)}
              disabled={extracting}
              className="flex-1"
            >
              {extracting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start Extraction
            </Button>
          )}
        </div>
      </div>
    )
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat History Extraction</h1>
        <p className="text-gray-600">
          Extract and consolidate chat conversations from AI providers that don't offer programmatic access
        </p>
      </div>

      {/* Extraction Status Overview */}
      {extractionStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Captured</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{extractionStatus.total_conversations_captured}</div>
              <p className="text-xs text-muted-foreground">conversations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{extractionStatus.extraction_rate}</div>
              <p className="text-xs text-muted-foreground">extraction success</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Extractions</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{extractionStatus.active_extractions}</div>
              <p className="text-xs text-muted-foreground">running now</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Extraction</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(extractionStatus.last_extraction).toLocaleTimeString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(extractionStatus.last_extraction).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Extraction Progress */}
      {extracting && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Extracting conversations from {selectedProvider}...</h3>
                <span className="text-sm text-gray-500">{Math.round(extractionProgress)}%</span>
              </div>
              <Progress value={extractionProgress} className="w-full" />
              <p className="text-sm text-gray-600">
                This may take a few minutes depending on the number of conversations
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers">Supported Providers</TabsTrigger>
          <TabsTrigger value="results">Extraction Results</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getProviderIcon(provider.id)}
                      <div>
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        <CardDescription>{provider.description}</CardDescription>
                      </div>
                    </div>
                    {validatedCredentials[provider.id] && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Capabilities</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {provider.capabilities.map((capability) => (
                          <Badge key={capability} variant="secondary" className="text-xs flex items-center gap-1">
                            {getCapabilityIcon(capability)}
                            {capability.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{provider.tools_count} tools available</span>
                      <span>{provider.auth_methods.join(', ')} auth</span>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full" 
                          variant={validatedCredentials[provider.id] ? "default" : "outline"}
                          onClick={() => setSelectedProvider(provider.id)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {validatedCredentials[provider.id] ? 'Extract History' : 'Setup Credentials'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {getProviderIcon(provider.id)}
                            Setup {provider.name} Extraction
                          </DialogTitle>
                          <DialogDescription>
                            Configure credentials and settings for extracting chat history from {provider.name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-amber-900">Security Notice</h4>
                                <p className="text-sm text-amber-800 mt-1">
                                  Your credentials are encrypted and used only for extraction. 
                                  We recommend using session tokens with limited scope when possible.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {renderCredentialsForm(provider)}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {extractionResults ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getProviderIcon(extractionResults.metadata.provider)}
                    Extraction Results - {extractionResults.metadata.provider.toUpperCase()}
                  </CardTitle>
                  <CardDescription>
                    Extracted {extractionResults.metadata.total_conversations} conversations 
                    on {new Date(extractionResults.metadata.extraction_timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline">
                      Method: {extractionResults.metadata.extraction_method}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Results
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {extractionResults.conversations.map((conversation) => (
                  <Card key={conversation.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{conversation.title}</CardTitle>
                      <CardDescription>
                        {conversation.messages.length} messages • 
                        Created {new Date(conversation.created_at).toLocaleDateString()} • 
                        Updated {new Date(conversation.updated_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {conversation.messages.slice(0, 3).map((message, index) => (
                          <div key={index} className={`p-3 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-blue-50 border-l-4 border-blue-400' 
                              : 'bg-gray-50 border-l-4 border-gray-400'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                                {message.role}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-3">
                              {message.content}
                            </p>
                          </div>
                        ))}
                        {conversation.messages.length > 3 && (
                          <p className="text-sm text-gray-500 text-center">
                            ... and {conversation.messages.length - 3} more messages
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Extraction Results</h3>
                  <p className="text-gray-600 mb-4">
                    Start an extraction from the Providers tab to see results here
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
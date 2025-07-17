import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { blink } from '../blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Separator } from '../components/ui/separator'
import { MessageSquare, Bot, User, ExternalLink, Copy, Calendar, Hash } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  mcp_tool_calls?: Array<{
    tool: string
    parameters: Record<string, any>
    result?: any
  }>
}

interface SharedConversation {
  id: string
  title: string
  provider: string
  subject: string
  messages: Message[]
  created_at: string
  shared_by: string
  mcp_server?: string
  mcp_tools?: string[]
}

export function SharedConversation() {
  const { token } = useParams<{ token: string }>()
  const [conversation, setConversation] = useState<SharedConversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      loadSharedConversation(token)
    }
  }, [token])

  const loadSharedConversation = async (shareToken: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await blink.data.fetch({
        url: `https://6t5rfkr8--share.functions.blink.new/${shareToken}`,
        method: 'GET'
      })
      
      if (response.status === 200) {
        setConversation(response.body.conversation)
      } else if (response.status === 404) {
        setError('Shared conversation not found or has expired')
      } else {
        setError('Failed to load shared conversation')
      }
    } catch (error) {
      console.error('Failed to load shared conversation:', error)
      setError('Failed to load shared conversation')
    } finally {
      setLoading(false)
    }
  }

  const copyShareLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success('Share link copied to clipboard')
  }

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      'openai': 'bg-green-100 text-green-800',
      'anthropic': 'bg-orange-100 text-orange-800',
      'google': 'bg-blue-100 text-blue-800',
      'microsoft': 'bg-purple-100 text-purple-800',
      'meta': 'bg-indigo-100 text-indigo-800',
      'mcp': 'bg-pink-100 text-pink-800'
    }
    return colors[provider.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg w-96"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Conversation Not Found</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.href = '/'}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!conversation) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{conversation.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 text-base">
                  <span className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Subject: {conversation.subject}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatTimestamp(conversation.created_at)}
                  </span>
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className={getProviderColor(conversation.provider)}>
                  {conversation.provider}
                </Badge>
                <Button variant="outline" size="sm" onClick={copyShareLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
            
            {conversation.mcp_server && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-900">MCP Integration</span>
                </div>
                <p className="text-sm text-purple-800">
                  Server: <code className="bg-purple-100 px-1 rounded">{conversation.mcp_server}</code>
                </p>
                {conversation.mcp_tools && conversation.mcp_tools.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-purple-800">Tools used: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {conversation.mcp_tools.map((tool, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Messages */}
        <div className="space-y-4">
          {conversation.messages.map((message, index) => (
            <Card key={index} className={`${
              message.role === 'user' 
                ? 'ml-8 border-blue-200 bg-blue-50/50' 
                : 'mr-8 border-gray-200'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={
                      message.role === 'user' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium capitalize">
                        {message.role === 'user' ? 'User' : 'Assistant'}
                      </span>
                      {message.timestamp && (
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      )}
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap text-gray-900">
                        {message.content}
                      </p>
                    </div>
                    
                    {/* MCP Tool Calls */}
                    {message.mcp_tool_calls && message.mcp_tool_calls.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <Separator />
                        <div className="text-sm font-medium text-purple-700">
                          MCP Tool Calls:
                        </div>
                        {message.mcp_tool_calls.map((toolCall, toolIndex) => (
                          <div key={toolIndex} className="bg-purple-50 border border-purple-200 rounded p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <ExternalLink className="h-3 w-3 text-purple-600" />
                              <code className="text-sm font-medium text-purple-900">
                                {toolCall.tool}
                              </code>
                            </div>
                            
                            {Object.keys(toolCall.parameters).length > 0 && (
                              <div className="mb-2">
                                <div className="text-xs text-purple-700 mb-1">Parameters:</div>
                                <pre className="text-xs bg-purple-100 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(toolCall.parameters, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {toolCall.result && (
                              <div>
                                <div className="text-xs text-purple-700 mb-1">Result:</div>
                                <pre className="text-xs bg-purple-100 p-2 rounded overflow-x-auto">
                                  {typeof toolCall.result === 'string' 
                                    ? toolCall.result 
                                    : JSON.stringify(toolCall.result, null, 2)
                                  }
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">
                This conversation was shared from the AI Chat History Manager
              </p>
              <p>
                Shared by: <span className="font-medium">{conversation.shared_by}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
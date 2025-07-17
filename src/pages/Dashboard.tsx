import { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { MessageSquare, Bot, Search, Plus, ExternalLink } from 'lucide-react'

interface Conversation {
  id: string
  title: string
  provider: string
  subject: string
  message_count: number
  last_updated: string
  created_at: string
  user_id: string
}

interface Subject {
  name: string
  conversation_count: number
  providers: string[]
  last_updated: string
}

export function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load conversations
      const conversationsData = await blink.data.fetch({
        url: 'https://6t5rfkr8--conversations.functions.blink.new',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      
      if (conversationsData.status === 200) {
        const convs = conversationsData.body.conversations || []
        setConversations(convs)
        
        // Group by subjects
        const subjectMap = new Map<string, Subject>()
        convs.forEach((conv: Conversation) => {
          const subject = conv.subject || 'Uncategorized'
          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, {
              name: subject,
              conversation_count: 0,
              providers: [],
              last_updated: conv.last_updated
            })
          }
          
          const subjectData = subjectMap.get(subject)!
          subjectData.conversation_count++
          if (!subjectData.providers.includes(conv.provider)) {
            subjectData.providers.push(conv.provider)
          }
          if (new Date(conv.last_updated) > new Date(subjectData.last_updated)) {
            subjectData.last_updated = conv.last_updated
          }
        })
        
        setSubjects(Array.from(subjectMap.values()))
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.provider.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSubject = !selectedSubject || conv.subject === selectedSubject
    
    return matchesSearch && matchesSubject
  })

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Manage your AI conversations across all providers with MCP integration
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Subjects</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Providers</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(conversations.map(c => c.provider)).size}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MCP Connections</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.filter(c => c.provider.toLowerCase() === 'mcp').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations, subjects, or providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={loadData} variant="outline">
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="subjects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="conversations">All Conversations</TabsTrigger>
          <TabsTrigger value="mcp">MCP Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <Card 
                key={subject.name} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedSubject(selectedSubject === subject.name ? null : subject.name)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <CardDescription>
                    {subject.conversation_count} conversation{subject.conversation_count !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {subject.providers.map((provider) => (
                      <Badge key={provider} className={getProviderColor(provider)}>
                        {provider}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(subject.last_updated).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <Card key={conversation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{conversation.title}</CardTitle>
                      <CardDescription>Subject: {conversation.subject}</CardDescription>
                    </div>
                    <Badge className={getProviderColor(conversation.provider)}>
                      {conversation.provider}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{conversation.message_count} messages</span>
                    <span>Updated: {new Date(conversation.last_updated).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mcp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MCP (Model Context Protocol) Integration</CardTitle>
              <CardDescription>
                Create tools to capture chat history from AI providers that don't offer programmatic access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">🚀 Chat History Extraction</h3>
                <p className="text-blue-800 text-sm mb-3">
                  Many AI providers (ChatGPT, Claude, Gemini) don't provide APIs to access your chat history. 
                  Our MCP tools solve this by creating custom extractors that can capture conversations 
                  directly from web interfaces and consolidate them into your unified library.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white/50 rounded px-2 py-1 text-center">
                    <div className="font-medium text-green-700">ChatGPT</div>
                    <div className="text-green-600">Web Scraping</div>
                  </div>
                  <div className="bg-white/50 rounded px-2 py-1 text-center">
                    <div className="font-medium text-orange-700">Claude</div>
                    <div className="text-orange-600">DOM Parsing</div>
                  </div>
                  <div className="bg-white/50 rounded px-2 py-1 text-center">
                    <div className="font-medium text-blue-700">Gemini</div>
                    <div className="text-blue-600">Session Monitor</div>
                  </div>
                  <div className="bg-white/50 rounded px-2 py-1 text-center">
                    <div className="font-medium text-purple-700">Custom</div>
                    <div className="text-purple-600">API Bridge</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">MCP Servers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {conversations.filter(c => c.provider.toLowerCase() === 'mcp').length}
                    </div>
                    <p className="text-sm text-gray-500">Active extractors</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Extraction Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">15</div>
                    <p className="text-sm text-gray-500">Provider tools</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Captured Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">47</div>
                    <p className="text-sm text-gray-500">New conversations</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button className="flex-1" asChild>
                  <a href="/mcp-manager">
                    <Plus className="w-4 h-4 mr-2" />
                    Manage MCP Servers
                  </a>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href="/chat-extraction">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Start Extraction
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
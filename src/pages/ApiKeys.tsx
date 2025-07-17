import { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog'
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  last_used: string | null
  permissions: string[]
  usage_count: number
}

export function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read'])
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      setLoading(true)
      const response = await blink.data.fetch({
        url: 'https://6t5rfkr8--keys.functions.blink.new',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })
      
      if (response.status === 200) {
        setApiKeys(response.body.keys || [])
      }
    } catch (error) {
      console.error('Failed to load API keys:', error)
      toast.error('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name')
      return
    }

    try {
      const response = await blink.data.fetch({
        url: 'https://6t5rfkr8--keys.functions.blink.new',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer demo-token'
        },
        body: {
          name: newKeyName,
          permissions: newKeyPermissions
        }
      })

      if (response.status === 201) {
        toast.success('API key created successfully')
        setNewKeyName('')
        setNewKeyPermissions(['read'])
        setShowCreateDialog(false)
        loadApiKeys()
      }
    } catch (error) {
      console.error('Failed to create API key:', error)
      toast.error('Failed to create API key')
    }
  }

  const deleteApiKey = async (keyId: string) => {
    try {
      const response = await blink.data.fetch({
        url: `https://6t5rfkr8--keys.functions.blink.new/${keyId}`,
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer demo-token'
        }
      })

      if (response.status === 200) {
        toast.success('API key deleted successfully')
        loadApiKeys()
      }
    } catch (error) {
      console.error('Failed to delete API key:', error)
      toast.error('Failed to delete API key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('API key copied to clipboard')
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  const togglePermission = (permission: string) => {
    if (newKeyPermissions.includes(permission)) {
      setNewKeyPermissions(newKeyPermissions.filter(p => p !== permission))
    } else {
      setNewKeyPermissions([...newKeyPermissions, permission])
    }
  }

  const getPermissionColor = (permission: string) => {
    const colors: Record<string, string> = {
      'read': 'bg-green-100 text-green-800',
      'write': 'bg-yellow-100 text-yellow-800',
      'delete': 'bg-red-100 text-red-800',
      'mcp': 'bg-purple-100 text-purple-800'
    }
    return colors[permission] || 'bg-gray-100 text-gray-800'
  }

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key
    return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys</h1>
            <p className="text-gray-600">
              Manage your API keys for accessing the Chat History Manager API
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key to access the Chat History Manager API
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production App, Development"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['read', 'write', 'delete', 'mcp'].map((permission) => (
                      <div
                        key={permission}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          newKeyPermissions.includes(permission)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => togglePermission(permission)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{permission}</span>
                          <div className={`w-4 h-4 rounded border-2 ${
                            newKeyPermissions.includes(permission)
                              ? 'bg-primary border-primary'
                              : 'border-gray-300'
                          }`}>
                            {newKeyPermissions.includes(permission) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {permission === 'read' && 'Read conversations and data'}
                          {permission === 'write' && 'Create and update conversations'}
                          {permission === 'delete' && 'Delete conversations and data'}
                          {permission === 'mcp' && 'Access MCP server connections'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createApiKey}>
                  Create Key
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Security Notice */}
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900">Security Best Practices</h3>
              <ul className="text-sm text-amber-800 mt-2 space-y-1">
                <li>• Store API keys securely and never commit them to version control</li>
                <li>• Use different keys for different environments (development, production)</li>
                <li>• Regularly rotate your API keys</li>
                <li>• Grant only the minimum permissions required</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
                <p className="text-gray-600 mb-4">
                  Create your first API key to start using the Chat History Manager API
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create API Key
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      {apiKey.name}
                    </CardTitle>
                    <CardDescription>
                      Created {new Date(apiKey.created_at).toLocaleDateString()}
                      {apiKey.last_used && (
                        <> • Last used {new Date(apiKey.last_used).toLocaleDateString()}</>
                      )}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the API key "{apiKey.name}"? 
                            This action cannot be undone and will immediately revoke access.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteApiKey(apiKey.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Key
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">API Key</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="flex-1 bg-gray-50 px-3 py-2 rounded border text-sm font-mono">
                        {visibleKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}
                      </code>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Permissions</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {apiKey.permissions.map((permission) => (
                          <Badge key={permission} className={getPermissionColor(permission)}>
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Label className="text-sm font-medium">Usage</Label>
                      <p className="text-sm text-gray-600">
                        {apiKey.usage_count.toLocaleString()} requests
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface ApiKey {
  id: string;
  user_id: string;
  key_name: string;
  api_key: string;
  permissions: string;
  created_at: string;
  last_used?: string;
  is_active: number;
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

  const url = new URL(req.url);
  const method = req.method;
  const pathSegments = url.pathname.split('/').filter(Boolean);

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Generate API key
    const generateApiKey = () => {
      return 'chm_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    // Mock API keys data
    const mockApiKeys: ApiKey[] = [
      {
        id: 'key_1',
        user_id: 'user_123',
        key_name: 'Production API',
        api_key: 'chm_abc123def456ghi789',
        permissions: 'read,write',
        created_at: '2024-01-15T10:30:00Z',
        last_used: '2024-01-16T14:20:00Z',
        is_active: 1
      },
      {
        id: 'key_2',
        user_id: 'user_123',
        key_name: 'Development API',
        api_key: 'chm_xyz789uvw456rst123',
        permissions: 'read',
        created_at: '2024-01-10T09:15:00Z',
        last_used: '2024-01-15T16:45:00Z',
        is_active: 1
      }
    ];

    if (method === 'GET' && pathSegments.length === 0) {
      // GET /api/keys - List all API keys for user
      const userKeys = mockApiKeys.map(key => ({
        ...key,
        api_key: key.api_key.substring(0, 12) + '...' // Mask the key
      }));

      return new Response(JSON.stringify({
        api_keys: userKeys,
        total: userKeys.length
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (method === 'POST' && pathSegments.length === 0) {
      // POST /api/keys - Create new API key
      const body = await req.json();
      const { key_name, permissions = 'read' } = body;

      if (!key_name) {
        return new Response(JSON.stringify({ error: 'key_name is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const newApiKey: ApiKey = {
        id: `key_${Date.now()}`,
        user_id: 'user_123', // Get from auth
        key_name,
        api_key: generateApiKey(),
        permissions,
        created_at: new Date().toISOString(),
        is_active: 1
      };

      return new Response(JSON.stringify({
        api_key: newApiKey,
        message: 'API key created successfully',
        warning: 'Please save this key securely. It will not be shown again.'
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (method === 'PUT' && pathSegments.length === 1) {
      // PUT /api/keys/:id - Update API key (permissions, active status)
      const keyId = pathSegments[0];
      const body = await req.json();
      const { permissions, is_active } = body;

      const existingKey = mockApiKeys.find(key => key.id === keyId);
      if (!existingKey) {
        return new Response(JSON.stringify({ error: 'API key not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const updatedKey = {
        ...existingKey,
        permissions: permissions || existingKey.permissions,
        is_active: is_active !== undefined ? is_active : existingKey.is_active
      };

      return new Response(JSON.stringify({
        api_key: {
          ...updatedKey,
          api_key: updatedKey.api_key.substring(0, 12) + '...' // Mask the key
        },
        message: 'API key updated successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (method === 'DELETE' && pathSegments.length === 1) {
      // DELETE /api/keys/:id - Delete API key
      const keyId = pathSegments[0];
      
      return new Response(JSON.stringify({
        message: 'API key deleted successfully',
        key_id: keyId
      }), {
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
    console.error('API Keys Error:', error);
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
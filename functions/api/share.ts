import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface ShareToken {
  id: string;
  conversation_id: string;
  user_id: string;
  share_token: string;
  permissions: string;
  expires_at?: string;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

    // Generate random share token
    const generateShareToken = () => {
      return 'share_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    // Mock shared conversations data
    const mockSharedConversations: ShareToken[] = [
      {
        id: 'share_1',
        conversation_id: 'conv_1',
        user_id: 'user_123',
        share_token: 'share_abc123def456',
        permissions: 'read',
        expires_at: '2024-02-15T10:30:00Z',
        created_at: '2024-01-15T10:30:00Z'
      }
    ];

    if (method === 'POST' && pathSegments.length === 0) {
      // POST /api/share - Create a share token for a conversation
      const body = await req.json();
      const { conversation_id, permissions = 'read', expires_in_days = 30 } = body;

      if (!conversation_id) {
        return new Response(JSON.stringify({ error: 'conversation_id is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const shareToken = generateShareToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);

      const newShare: ShareToken = {
        id: `share_${Date.now()}`,
        conversation_id,
        user_id: 'user_123', // Get from auth
        share_token: shareToken,
        permissions,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      };

      return new Response(JSON.stringify({
        share: newShare,
        share_url: `${url.origin}/shared/${shareToken}`,
        api_url: `${url.origin}/api/shared/${shareToken}`,
        message: 'Share token created successfully'
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (method === 'GET' && pathSegments.length === 1) {
      // GET /api/share/:conversation_id - Get share tokens for a conversation
      const conversationId = pathSegments[0];
      const shares = mockSharedConversations.filter(share => share.conversation_id === conversationId);

      return new Response(JSON.stringify({
        shares,
        conversation_id: conversationId
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (method === 'DELETE' && pathSegments.length === 1) {
      // DELETE /api/share/:share_token - Revoke a share token
      const shareToken = pathSegments[0];
      
      return new Response(JSON.stringify({
        message: 'Share token revoked successfully',
        share_token: shareToken
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
    console.error('Share API Error:', error);
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
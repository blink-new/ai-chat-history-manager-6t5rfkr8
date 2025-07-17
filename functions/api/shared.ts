import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(req.url);
  const method = req.method;
  const pathSegments = url.pathname.split('/').filter(Boolean);

  try {
    if (method === 'GET' && pathSegments.length === 1) {
      // GET /api/shared/:share_token - Access shared conversation via token
      const shareToken = pathSegments[0];

      // Mock validation of share token
      if (!shareToken.startsWith('share_')) {
        return new Response(JSON.stringify({ error: 'Invalid share token' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Mock shared conversation data
      const sharedConversation = {
        id: 'conv_1',
        title: 'React Best Practices Discussion',
        subject: 'React Development',
        provider: 'ChatGPT',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T11:45:00Z',
        shared_by: 'user_123',
        share_permissions: 'read',
        messages: [
          {
            id: 'msg_1',
            role: 'user',
            content: 'What are the best practices for React component organization?',
            timestamp: '2024-01-15T10:30:00Z'
          },
          {
            id: 'msg_2',
            role: 'assistant',
            content: 'Here are some key React component organization best practices:\n\n1. **Feature-based folder structure**: Organize components by features rather than by type\n2. **Single Responsibility Principle**: Each component should have one clear purpose\n3. **Composition over inheritance**: Use composition patterns for reusability\n4. **Custom hooks for logic**: Extract reusable logic into custom hooks\n5. **Proper prop drilling**: Use context or state management for deeply nested props',
            timestamp: '2024-01-15T10:31:00Z'
          },
          {
            id: 'msg_3',
            role: 'user',
            content: 'Can you give me an example of feature-based folder structure?',
            timestamp: '2024-01-15T10:32:00Z'
          },
          {
            id: 'msg_4',
            role: 'assistant',
            content: 'Sure! Here\'s an example of a feature-based folder structure:\n\n```\nsrc/\n├── components/\n│   ├── ui/           # Reusable UI components\n│   │   ├── Button/\n│   │   ├── Input/\n│   │   └── Modal/\n├── features/\n│   ├── auth/         # Authentication feature\n│   │   ├── components/\n│   │   ├── hooks/\n│   │   ├── services/\n│   │   └── types.ts\n│   ├── dashboard/    # Dashboard feature\n│   │   ├── components/\n│   │   ├── hooks/\n│   │   └── services/\n│   └── profile/      # Profile feature\n│       ├── components/\n│       ├── hooks/\n│       └── services/\n├── shared/           # Shared utilities\n│   ├── hooks/\n│   ├── utils/\n│   └── types/\n└── pages/           # Route components\n```\n\nThis structure keeps related functionality together and makes the codebase more maintainable.',
            timestamp: '2024-01-15T10:33:00Z'
          }
        ]
      };

      return new Response(JSON.stringify({
        conversation: sharedConversation,
        share_token: shareToken,
        access_type: 'public_share'
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
    console.error('Shared API Error:', error);
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
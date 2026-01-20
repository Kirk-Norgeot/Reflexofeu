import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'technicien' | 'admin';
}

interface DeleteUserRequest {
  userId: string;
}

interface UpdateUserRequest {
  userId: string;
  password?: string;
  fullName?: string;
  role?: 'technicien' | 'admin';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'GET' && action === 'list') {
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) throw error;

      const usersWithProfiles = await Promise.all(
        users.users.map(async (user) => {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role, full_name')
            .eq('id', user.id)
            .maybeSingle();

          return {
            id: user.id,
            email: user.email,
            full_name: profile?.full_name || user.user_metadata?.full_name,
            role: profile?.role || 'technicien',
            created_at: user.created_at,
          };
        })
      );

      return new Response(
        JSON.stringify({ success: true, users: usersWithProfiles }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (req.method === 'POST' && action === 'create') {
      const body: CreateUserRequest = await req.json();
      const { email, password, fullName, role } = body;

      if (!email || !password || !fullName || !role) {
        return new Response(
          JSON.stringify({ success: false, error: 'Tous les champs sont requis' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email === email);

      if (userExists) {
        return new Response(
          JSON.stringify({ success: false, error: 'Un utilisateur avec cet email existe déjà' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

      if (createError) throw createError;

      if (userData.user) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            role,
            full_name: fullName
          })
          .eq('id', userData.user.id);

        if (profileError) throw profileError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Utilisateur créé avec succès',
          user: {
            id: userData.user?.id,
            email,
            full_name: fullName,
            role,
          }
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (req.method === 'PUT' && action === 'update') {
      const body: UpdateUserRequest = await req.json();
      const { userId, password, fullName, role } = body;

      if (!userId) {
        return new Response(
          JSON.stringify({ success: false, error: 'User ID requis' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (password) {
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password }
        );
        if (passwordError) throw passwordError;
      }

      if (fullName || role) {
        const updateData: any = {};
        if (fullName) updateData.full_name = fullName;
        if (role) updateData.role = role;

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Utilisateur mis à jour avec succès'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (req.method === 'DELETE') {
      const body: DeleteUserRequest = await req.json();
      const { userId } = body;

      if (!userId) {
        return new Response(
          JSON.stringify({ success: false, error: 'User ID requis' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Utilisateur supprimé avec succès'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Action non reconnue' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

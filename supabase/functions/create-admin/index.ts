import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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

    const email = 'admin@reflexofeu.fr';
    const password = 'admin123';

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email);

    if (userExists) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Le compte admin existe déjà',
          email 
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Créer l'utilisateur
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrateur ReflexOFeu',
      },
    });

    if (createError) {
      throw createError;
    }

    // Mettre à jour le profil avec le rôle admin
    if (userData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          role: 'admin',
          full_name: 'Administrateur ReflexOFeu'
        })
        .eq('id', userData.user.id);

      if (profileError) {
        throw profileError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Compte admin créé avec succès. Le mot de passe par défaut est admin123 - Veuillez le changer immédiatement.',
        email
      }),
      {
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
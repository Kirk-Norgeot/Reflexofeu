import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ClientData {
  nom: string;
  adresse: string;
  adresse2?: string | null;
  code_postal: string;
  ville: string;
  contact?: string | null;
  telephone?: string | null;
  email?: string | null;
  multi_site?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentification requise" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token invalide" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { clients } = await req.json();

    if (!Array.isArray(clients) || clients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucun client fourni" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = {
      imported: 0,
      errors: [] as { client: string; error: string }[],
    };

    for (const client of clients) {
      try {
        if (!client.nom || !client.adresse || !client.code_postal || !client.ville) {
          results.errors.push({
            client: client.nom || "Client sans nom",
            error: "Données obligatoires manquantes",
          });
          continue;
        }

        const clientData: ClientData = {
          nom: client.nom.trim(),
          adresse: client.adresse.trim(),
          adresse2: client.adresse2?.trim() || null,
          code_postal: String(client.code_postal).trim(),
          ville: client.ville.trim(),
          contact: client.contact?.trim() || null,
          telephone: client.telephone?.trim() || null,
          email: client.email?.trim() || null,
          multi_site: client.multi_site || false,
        };

        const { error: insertError } = await supabaseClient
          .from("clients")
          .insert([{
            ...clientData,
            created_by: user.id,
          }]);

        if (insertError) {
          if (insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
            results.errors.push({
              client: client.nom,
              error: "Client déjà existant",
            });
          } else {
            throw insertError;
          }
        } else {
          results.imported++;
        }
      } catch (error) {
        results.errors.push({
          client: client.nom || "Client sans nom",
          error: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: results.imported,
        total: clients.length,
        errors: results.errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur import clients:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erreur serveur",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
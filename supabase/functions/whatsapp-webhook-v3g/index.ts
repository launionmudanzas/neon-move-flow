/**
 * whatsapp-webhook — La Unión Mudanzas
 * Processes incoming WhatsApp messages, upserts contacts, and links leads by folio.
 * NOTE: Function folder still named whatsapp-webhook-v3g for deploy compatibility.
 *       Will be renamed in a future migration.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ─── GET: WhatsApp webhook verification ───
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const VERIFY_TOKEN = Deno.env.get("WA_VERIFY_TOKEN") || "lum-verify-token";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // ─── POST: Incoming webhook from WhatsApp Business Platform ───
  if (req.method === "POST") {
    try {
      const body = await req.json();

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const entries = body?.entry || [];
      for (const entry of entries) {
        const changes = entry?.changes || [];
        for (const change of changes) {
          if (change?.field !== "messages") continue;
          const value = change?.value;
          if (!value?.messages) continue;

          const contacts = value.contacts || [];
          const messages = value.messages || [];

          for (const msg of messages) {
            const contactMatch = contacts.find(
              (c: any) => c.wa_id === msg.from
            );
            const bsuid = msg.from;
            const contactName = contactMatch?.profile?.name || null;
            const phoneNumber = msg.from;
            const messageBody = msg.text?.body || msg.caption || "";
            const messageId = msg.id;
            const timestamp = msg.timestamp
              ? new Date(parseInt(msg.timestamp) * 1000).toISOString()
              : new Date().toISOString();

            // 1. Upsert whatsapp_contact by BSUID
            const { data: existingContact } = await supabase
              .from("whatsapp_contacts")
              .select("id, lead_id")
              .eq("bsuid", bsuid)
              .maybeSingle();

            let contactId: string;
            let leadId: string | null = null;

            if (existingContact) {
              contactId = existingContact.id;
              leadId = existingContact.lead_id;
              await supabase
                .from("whatsapp_contacts")
                .update({
                  last_message_at: timestamp,
                  nombre: contactName || undefined,
                  telefono_whatsapp: phoneNumber,
                })
                .eq("id", contactId);
            } else {
              const { data: newContact } = await supabase
                .from("whatsapp_contacts")
                .insert({
                  bsuid,
                  telefono_whatsapp: phoneNumber,
                  nombre: contactName,
                  last_message_at: timestamp,
                })
                .select("id")
                .single();
              contactId = newContact!.id;
            }

            // 2. Detect folio in message body (LUM-YYYYMMDD-XXXX or legacy V3G-YYYYMMDD-XXXX)
            const folioMatch = messageBody.match(/(?:LUM|V3G)-\d{8}-\d{4}/);
            if (folioMatch && !leadId) {
              const { data: lead } = await supabase
                .from("leads_v3g")
                .select("id")
                .eq("folio", folioMatch[0])
                .maybeSingle();

              if (lead) {
                await supabase
                  .from("whatsapp_contacts")
                  .update({ lead_id: lead.id })
                  .eq("id", contactId);
              }
            }

            // 3. Store message
            await supabase.from("whatsapp_messages").insert({
              contact_id: contactId,
              direction: "inbound",
              message_id: messageId,
              body: messageBody,
              raw_payload: msg,
              created_at: timestamp,
            });
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Webhook error:", err);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  return new Response("Method not allowed", {
    status: 405,
    headers: corsHeaders,
  });
});

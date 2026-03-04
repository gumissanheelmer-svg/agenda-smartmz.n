import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { business_id, appointment_id, event_type } = await req.json();

    if (!business_id || !appointment_id || !event_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check dedup for email channel
    const { data: existing } = await supabase
      .from("notification_events")
      .select("id")
      .eq("appointment_id", appointment_id)
      .eq("event_type", event_type)
      .eq("channel", "email")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Already sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch business + appointment data
    const { data: business } = await supabase
      .from("barbershops")
      .select("name, owner_email, currency_code")
      .eq("id", business_id)
      .single();

    if (!business?.owner_email) {
      return new Response(
        JSON.stringify({ success: false, reason: "No owner_email configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: appointment } = await supabase
      .from("appointments")
      .select("client_name, client_phone, appointment_date, appointment_time, barber_id, service_id")
      .eq("id", appointment_id)
      .single();

    if (!appointment) {
      return new Response(
        JSON.stringify({ success: false, reason: "Appointment not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: service } = await supabase
      .from("services")
      .select("name, price")
      .eq("id", appointment.service_id)
      .single();

    const { data: barber } = await supabase
      .from("barbers")
      .select("name")
      .eq("id", appointment.barber_id)
      .single();

    // Build app URL
    const appUrl = Deno.env.get("APP_URL") || `${supabaseUrl.replace(".supabase.co", ".lovable.app")}`;
    const panelLink = `${appUrl}/admin/appointments?focus=${appointment_id}`;

    const subject =
      event_type === "CODE_SUBMITTED"
        ? "Código de pagamento submetido — confirme no painel"
        : "Novo agendamento — verifique o pagamento";

    const emailBody = `Chegou um novo agendamento no seu negócio.

Caso o cliente tenha realizado o pagamento, verifique no seu celular se o valor entrou.
Depois, entre no painel para confirmar ou rejeitar o agendamento.

Cliente: ${appointment.client_name}
Serviço: ${service?.name || "—"}
Profissional: ${barber?.name || "—"}
Data: ${appointment.appointment_date}
Hora: ${appointment.appointment_time}
Valor: ${service?.price || "—"} ${business.currency_code || "MZN"}

👉 Entrar no Painel: ${panelLink}`;

    let emailSent = false;

    // Attempt email via Resend if configured
    if (resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Agenda Smart <noreply@agendamart.com>",
            to: [business.owner_email],
            subject,
            text: emailBody,
            html: buildHtmlEmail(subject, emailBody, panelLink, business.name),
          }),
        });

        if (res.ok) {
          emailSent = true;
        } else {
          console.error("Resend error:", await res.text());
        }
      } catch (e) {
        console.error("Email send failed:", e);
      }
    }

    // Record email event if sent
    if (emailSent) {
      await supabase
        .from("notification_events")
        .insert({ appointment_id, event_type, channel: "email" });
    }

    return new Response(
      JSON.stringify({ success: true, email_sent: emailSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notify-owner error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildHtmlEmail(subject: string, textBody: string, panelLink: string, businessName: string): string {
  const lines = textBody.split("\n").filter(Boolean);
  const detailLines = lines.slice(2).filter((l) => !l.startsWith("👉"));

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="background:#0f0f1a;border-radius:12px;padding:32px 24px;color:#ffffff;">
      <h1 style="color:#D4AF37;font-size:20px;margin:0 0 8px;">${businessName}</h1>
      <h2 style="font-size:16px;margin:0 0 20px;color:#ffffff;">${subject}</h2>
      <p style="color:#cccccc;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Chegou um novo agendamento no seu negócio.<br/>
        Caso o cliente tenha realizado o pagamento, verifique no seu celular se o valor entrou.<br/>
        Depois, entre no painel para confirmar ou rejeitar o agendamento.
      </p>
      <div style="background:#1a1a2e;border-radius:8px;padding:16px;margin:0 0 24px;">
        ${detailLines.map((l) => `<p style="color:#eeeeee;font-size:14px;margin:4px 0;">${l}</p>`).join("")}
      </div>
      <a href="${panelLink}" style="display:inline-block;background:#D4AF37;color:#0f0f1a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
        Entrar no Painel
      </a>
    </div>
  </div>
</body>
</html>`;
}

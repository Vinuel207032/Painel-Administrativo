// Fix: Declare Deno global to satisfy the TypeScript compiler in environments where Deno types are not automatically loaded.
declare const Deno: any;

const RESEND_API_KEY = "re_dYM9UJC9_AHWBr4cW86oe5Usdh8SicZgF";
const SENDER_EMAIL = "suporte@clubedagentebrasil.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Tratar requisições de preflight do CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code, name } = await req.json();

    if (!email || !code) {
      throw new Error("E-mail e código são obrigatórios.");
    }

    console.log(`[Resend] Enviando e-mail para ${email} com código ${code}`);

    const htmlTemplate = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://i.ibb.co/rRRxMR96/Design-sem-nome-2.png" alt="Clube da Gente Brasil" style="height: 60px;">
        </div>
        <div style="border-left: 4px solid #facc15; padding-left: 20px; margin-bottom: 30px;">
          <h2 style="color: #111; text-transform: uppercase; letter-spacing: 1px; margin: 0; font-size: 20px;">Recuperação de Senha</h2>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">Portal Administrativo & Parceiros</p>
        </div>
        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          Olá, <strong>${name || 'Parceiro'}</strong>.
        </p>
        <p style="color: #444; font-size: 16px; line-height: 1.6;">
          Você solicitou a recuperação de acesso à sua conta. Utilize o código de segurança abaixo para validar sua identidade e definir uma nova senha:
        </p>
        <div style="background-color: #0f172a; padding: 30px; border-radius: 15px; text-align: center; margin: 40px 0; border: 2px solid #facc15;">
          <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #facc15; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; font-style: italic; text-align: center;">
          Este código é de uso único e expira em 15 minutos.
        </p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center;">
          <p style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">Clube da Gente Brasil</p>
          <p style="font-size: 10px; color: #94a3b8;">Área de Suporte e Segurança ao Operador</p>
        </div>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: email,
        subject: `🔒 Código de Segurança: ${code} - Clube da Gente`,
        html: htmlTemplate,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Resend API Error]:", result);
      throw new Error(result.message || "Falha na comunicação com API Resend.");
    }

    console.log("[Resend] E-mail enviado com sucesso! ID:", result.id);

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[Edge Function Error]:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
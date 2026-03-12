// Edge Function: send-echo-notifications
// Triggered by pg_cron every 15 minutes.
// Finds newly unlocked echoes and sends emails via Resend.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'echoes@yourdomain.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Echo {
  id: string;
  title: string;
  content: string | null;
  type: string;
  recipient_email: string | null;
  profiles: { email: string } | null;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

function buildEmailHtml(echo: Echo, isOwner: boolean): string {
  const greeting = isOwner
    ? 'Your Echo has unlocked! Here is what you wrote to yourself:'
    : 'Someone sent you an Echo. It has just unlocked:';

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
      <h1 style="font-size:24px;margin:0 0 8px">🔓 Echo Unlocked</h1>
      <p style="color:#6b7280;margin:0 0 32px">${greeting}</p>

      <div style="background:#f8faff;border-radius:16px;padding:24px;margin-bottom:32px">
        <h2 style="font-size:18px;margin:0 0 12px">${echo.title}</h2>
        ${echo.content ? `<p style="white-space:pre-wrap;line-height:1.6;margin:0">${echo.content}</p>` : ''}
      </div>

      <p style="font-size:12px;color:#9ca3af;margin:0">
        Sent with ❤️ via Send Echoes
      </p>
    </div>
  `;
}

Deno.serve(async () => {
  try {
    // 1. Find echoes that just unlocked and haven't been notified yet
    const { data: echoes, error } = await supabase
      .from('echoes')
      .select('id, title, content, type, recipient_email, profiles(email)')
      .lte('unlock_at', new Date().toISOString())
      .eq('is_unlocked', false);

    if (error) throw error;
    if (!echoes || echoes.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
    }

    let sent = 0;
    let failed = 0;

    for (const echo of echoes as Echo[]) {
      // 2. Mark as unlocked immediately (even if email fails)
      await supabase
        .from('echoes')
        .update({ is_unlocked: true })
        .eq('id', echo.id);

      // 3. Notify the owner
      const ownerEmail = echo.profiles?.email;
      if (ownerEmail) {
        try {
          await sendEmail(
            ownerEmail,
            `🔓 Your Echo "${echo.title}" has unlocked`,
            buildEmailHtml(echo, true)
          );
          await supabase.from('echo_notifications').insert({
            echo_id: echo.id,
            type: 'unlock_owner',
            email: ownerEmail,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });
          sent++;
        } catch (err) {
          console.error('[owner email]', echo.id, err);
          await supabase.from('echo_notifications').insert({
            echo_id: echo.id,
            type: 'unlock_owner',
            email: ownerEmail,
            status: 'failed',
          });
          failed++;
        }
      }

      // 4. Notify the recipient (if any)
      if (echo.recipient_email) {
        try {
          await sendEmail(
            echo.recipient_email,
            `🔓 Someone sent you an Echo: "${echo.title}"`,
            buildEmailHtml(echo, false)
          );
          await supabase.from('echo_notifications').insert({
            echo_id: echo.id,
            type: 'unlock_recipient',
            email: echo.recipient_email,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });
          sent++;
        } catch (err) {
          console.error('[recipient email]', echo.id, err);
          await supabase.from('echo_notifications').insert({
            echo_id: echo.id,
            type: 'unlock_recipient',
            email: echo.recipient_email,
            status: 'failed',
          });
          failed++;
        }
      }
    }

    return new Response(
      JSON.stringify({ processed: echoes.length, sent, failed }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[send-echo-notifications]', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

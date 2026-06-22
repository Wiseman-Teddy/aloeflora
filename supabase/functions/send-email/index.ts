import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subject, body, audience } = await req.json()

    // Example using Resend API to send the email campaign
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
       console.log("No RESEND_API_KEY set. Simulating email campaign blast.", { subject, body, audience });
       return new Response(
        JSON.stringify({ success: true, message: 'Simulated email campaign sent successfully. Configure RESEND_API_KEY for actual delivery.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'Aloeflora <updates@aloeflora.co.ke>',
        to: ['customers@aloeflora.co.ke'], // In a real scenario, map audience to actual user emails via Supabase query
        subject: subject,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>${subject}</h2>
            <p>${body}</p>
          </div>
        `
      })
    })

    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.message || 'Failed to send email via Resend')
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error("Error in send-email edge function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

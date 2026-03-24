/**
 * email-service.ts — La Unión Mudanzas
 * Shared utility to call the send-service-email Edge Function.
 * Handles feedback via toast and never throws (non-blocking).
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type EmailType =
  | 'cotizacion'
  | 'confirmacion_pago'
  | 'orden_servicio'
  | 'incidencia'
  | 'reembolso'
  | 'reagendacion';

export interface SendEmailPayload {
  type: EmailType;
  to?: string;           // client email (optional)
  folio?: string;
  customer_name?: string;
  route?: string;        // "Origen → Destino"
  service_date?: string;
  delivery_date?: string;
  service_type?: string;
  volume?: string;
  unit?: string;
  amount?: number;
  pdf_url?: string;      // link to the generated PDF
}

/**
 * Calls the send-service-email edge function.
 * Shows a brief toast on success or error.
 * Never throws — safe to call fire-and-forget with void.
 */
export async function sendServiceEmail(payload: SendEmailPayload): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('send-service-email', {
      body: payload,
    });

    if (error) throw error;

    if (data?.skipped) {
      // RESEND_API_KEY not configured — silent skip, no user-facing toast
      console.info('Email skipped: RESEND_API_KEY not configured');
      return;
    }

    toast({
      title: '📧 Correo enviado',
      description: getLabelForType(payload.type),
      duration: 3000,
    });
  } catch (err) {
    console.error('sendServiceEmail error:', err);
    toast({
      title: 'No se pudo enviar el correo',
      description: 'El flujo continuó correctamente. Puedes reenviar desde el panel.',
      variant: 'destructive',
      duration: 4000,
    });
  }
}

function getLabelForType(type: EmailType): string {
  const labels: Record<EmailType, string> = {
    cotizacion: 'Resumen de cotización enviado al cliente',
    confirmacion_pago: 'Confirmación de pago enviada',
    orden_servicio: 'Orden de servicio enviada',
    incidencia: 'Notificación de incidencia enviada',
    reembolso: 'Notificación de reembolso enviada',
    reagendacion: 'Nueva fecha de servicio notificada',
  };
  return labels[type] ?? 'Notificación enviada';
}

import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// ─── Input schemas ────────────────────────────────────────────────────────────

const uuidSchema = z
  .string()
  .trim()
  .uuid({ message: "El ID proporcionado no tiene un formato válido (UUID)" });

export const linkClienteSchema = z.object({
  cliente_id: uuidSchema,
});

export const linkProveedorSchema = z.object({
  proveedor_id: uuidSchema,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type LinkClienteInput = z.infer<typeof linkClienteSchema>;
export type LinkProveedorInput = z.infer<typeof linkProveedorSchema>;

interface RpcResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface UseLinkIdentityReturn {
  linkToCliente: (input: LinkClienteInput) => Promise<RpcResponse>;
  linkToProveedor: (input: LinkProveedorInput) => Promise<RpcResponse>;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Safe hook to link the authenticated user's account to an existing
 * cliente or proveedor record via the SECURITY DEFINER RPC
 * `public.link_user_identity`.
 *
 * All inputs are validated client-side with zod before the RPC call.
 * Server-side validation inside the SECURITY DEFINER function is the
 * authoritative check — client validation is a UX convenience only.
 */
export function useLinkIdentity(): UseLinkIdentityReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setSuccess(null);
  };

  // ── Link to a cliente ──────────────────────────────────────────────────────
  const linkToCliente = async (input: LinkClienteInput): Promise<RpcResponse> => {
    reset();

    // Client-side validation
    const parsed = linkClienteSchema.safeParse(input);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Datos inválidos";
      setError(msg);
      return { success: false, error: msg };
    }

    setIsLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("link_user_identity", {
        p_cliente_id: parsed.data.cliente_id,
        p_proveedor_id: null,
      });

      if (rpcError) {
        const msg = "Error al vincular la cuenta. Intenta de nuevo.";
        setError(msg);
        return { success: false, error: msg };
      }

      const result = data as RpcResponse;
      if (!result.success) {
        setError(result.error ?? "Error desconocido");
      } else {
        setSuccess(result.message ?? "Cuenta vinculada correctamente");
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Link to a proveedor ────────────────────────────────────────────────────
  const linkToProveedor = async (input: LinkProveedorInput): Promise<RpcResponse> => {
    reset();

    // Client-side validation
    const parsed = linkProveedorSchema.safeParse(input);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Datos inválidos";
      setError(msg);
      return { success: false, error: msg };
    }

    setIsLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("link_user_identity", {
        p_cliente_id: null,
        p_proveedor_id: parsed.data.proveedor_id,
      });

      if (rpcError) {
        const msg = "Error al vincular la cuenta. Intenta de nuevo.";
        setError(msg);
        return { success: false, error: msg };
      }

      const result = data as RpcResponse;
      if (!result.success) {
        setError(result.error ?? "Error desconocido");
      } else {
        setSuccess(result.message ?? "Cuenta vinculada correctamente");
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  return { linkToCliente, linkToProveedor, isLoading, error, success, reset };
}

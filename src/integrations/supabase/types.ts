export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      aceptaciones_legales: {
        Row: {
          acepta_cancelaciones: boolean | null
          acepta_condiciones: boolean | null
          acepta_pago_total: boolean | null
          acepta_privacidad: boolean | null
          acepta_terminos: boolean | null
          cliente_id: string | null
          cotizacion_id: string | null
          created_at: string | null
          fecha_aceptacion: string | null
          id: string
          ip: string | null
          texto_aceptacion: string | null
          user_agent: string | null
        }
        Insert: {
          acepta_cancelaciones?: boolean | null
          acepta_condiciones?: boolean | null
          acepta_pago_total?: boolean | null
          acepta_privacidad?: boolean | null
          acepta_terminos?: boolean | null
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string | null
          fecha_aceptacion?: string | null
          id?: string
          ip?: string | null
          texto_aceptacion?: string | null
          user_agent?: string | null
        }
        Update: {
          acepta_cancelaciones?: boolean | null
          acepta_condiciones?: boolean | null
          acepta_pago_total?: boolean | null
          acepta_privacidad?: boolean | null
          acepta_terminos?: boolean | null
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string | null
          fecha_aceptacion?: string | null
          id?: string
          ip?: string | null
          texto_aceptacion?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cotizacion"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      bitacora_servicio: {
        Row: {
          cotizacion_id: string | null
          created_at: string
          descripcion: string | null
          estatus_anterior: string | null
          estatus_nuevo: string | null
          evento: string
          id: string
          orden_id: string | null
          usuario_id: string | null
        }
        Insert: {
          cotizacion_id?: string | null
          created_at?: string
          descripcion?: string | null
          estatus_anterior?: string | null
          estatus_nuevo?: string | null
          evento: string
          id?: string
          orden_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          cotizacion_id?: string | null
          created_at?: string
          descripcion?: string | null
          estatus_anterior?: string | null
          estatus_nuevo?: string | null
          evento?: string
          id?: string
          orden_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_servicio_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_servicio_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      calificaciones_servicio: {
        Row: {
          cliente_id: string | null
          comentario: string | null
          cotizacion_id: string | null
          created_at: string
          cuidado_carga: number
          cumplimiento: number
          experiencia_general: number
          id: string
          orden_id: string
          promedio: number | null
          proveedor_id: string
          puntualidad: number
          trato: number
        }
        Insert: {
          cliente_id?: string | null
          comentario?: string | null
          cotizacion_id?: string | null
          created_at?: string
          cuidado_carga: number
          cumplimiento: number
          experiencia_general: number
          id?: string
          orden_id: string
          promedio?: number | null
          proveedor_id: string
          puntualidad: number
          trato: number
        }
        Update: {
          cliente_id?: string | null
          comentario?: string | null
          cotizacion_id?: string | null
          created_at?: string
          cuidado_carga?: number
          cumplimiento?: number
          experiencia_general?: number
          id?: string
          orden_id?: string
          promedio?: number | null
          proveedor_id?: string
          puntualidad?: number
          trato?: number
        }
        Relationships: [
          {
            foreignKeyName: "calificaciones_servicio_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificaciones_servicio_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificaciones_servicio_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: true
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificaciones_servicio_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificaciones_servicio_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      chats_publicaciones: {
        Row: {
          contacto_desbloqueado: boolean
          created_at: string
          estatus: string | null
          id: string
          proveedor_interesado_id: string
          proveedor_origen_id: string
          publicacion_id: string
        }
        Insert: {
          contacto_desbloqueado?: boolean
          created_at?: string
          estatus?: string | null
          id?: string
          proveedor_interesado_id: string
          proveedor_origen_id: string
          publicacion_id: string
        }
        Update: {
          contacto_desbloqueado?: boolean
          created_at?: string
          estatus?: string | null
          id?: string
          proveedor_interesado_id?: string
          proveedor_origen_id?: string
          publicacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_publicaciones_proveedor_interesado_id_fkey"
            columns: ["proveedor_interesado_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_publicaciones_proveedor_interesado_id_fkey"
            columns: ["proveedor_interesado_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_publicaciones_proveedor_origen_id_fkey"
            columns: ["proveedor_origen_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_publicaciones_proveedor_origen_id_fkey"
            columns: ["proveedor_origen_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_publicaciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_carga"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          correo: string | null
          created_at: string
          direccion_principal: string | null
          id: string
          ine_frente_url: string | null
          ine_reverso_url: string | null
          nombre_completo: string
          notas: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          correo?: string | null
          created_at?: string
          direccion_principal?: string | null
          id?: string
          ine_frente_url?: string | null
          ine_reverso_url?: string | null
          nombre_completo: string
          notas?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          correo?: string | null
          created_at?: string
          direccion_principal?: string | null
          id?: string
          ine_frente_url?: string | null
          ine_reverso_url?: string | null
          nombre_completo?: string
          notas?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      costos_adicionales: {
        Row: {
          activo: boolean
          costo: number | null
          created_at: string
          id: string
          regla: string | null
          subtipo: string | null
          tipo: string | null
          unidad_cobro: string | null
        }
        Insert: {
          activo?: boolean
          costo?: number | null
          created_at?: string
          id?: string
          regla?: string | null
          subtipo?: string | null
          tipo?: string | null
          unidad_cobro?: string | null
        }
        Update: {
          activo?: boolean
          costo?: number | null
          created_at?: string
          id?: string
          regla?: string | null
          subtipo?: string | null
          tipo?: string | null
          unidad_cobro?: string | null
        }
        Relationships: []
      }
      cotizaciones: {
        Row: {
          cliente_acepto: boolean
          cliente_id: string
          comentarios_especiales: string | null
          comision_app: number | null
          costo_adicionales: number | null
          costo_entrega: number | null
          costo_recoleccion: number | null
          cotizacion_especial: boolean
          created_at: string
          destino: string | null
          estatus: string | null
          fecha_llegada: string | null
          fecha_salida: string | null
          folio: string | null
          horario_carga: string | null
          horario_entrega: string | null
          id: string
          margen_negocio: number | null
          modalidad: string | null
          modalidad_sugerida: string | null
          observaciones: string | null
          origen: string | null
          peso: number | null
          porcentaje_urgencia: number
          precio_base: number | null
          precio_total: number | null
          presupuesto_cliente: number | null
          proveedor_id: string | null
          seguro_costo: number | null
          seguro_monto: number | null
          seguro_porcentaje: number | null
          tipo_servicio: string | null
          unidad_sugerida: string | null
          updated_at: string
          urgencia: boolean
          visita_ocular: boolean
          volumen_cobrable: number | null
          volumen_total: number | null
        }
        Insert: {
          cliente_acepto?: boolean
          cliente_id: string
          comentarios_especiales?: string | null
          comision_app?: number | null
          costo_adicionales?: number | null
          costo_entrega?: number | null
          costo_recoleccion?: number | null
          cotizacion_especial?: boolean
          created_at?: string
          destino?: string | null
          estatus?: string | null
          fecha_llegada?: string | null
          fecha_salida?: string | null
          folio?: string | null
          horario_carga?: string | null
          horario_entrega?: string | null
          id?: string
          margen_negocio?: number | null
          modalidad?: string | null
          modalidad_sugerida?: string | null
          observaciones?: string | null
          origen?: string | null
          peso?: number | null
          porcentaje_urgencia?: number
          precio_base?: number | null
          precio_total?: number | null
          presupuesto_cliente?: number | null
          proveedor_id?: string | null
          seguro_costo?: number | null
          seguro_monto?: number | null
          seguro_porcentaje?: number | null
          tipo_servicio?: string | null
          unidad_sugerida?: string | null
          updated_at?: string
          urgencia?: boolean
          visita_ocular?: boolean
          volumen_cobrable?: number | null
          volumen_total?: number | null
        }
        Update: {
          cliente_acepto?: boolean
          cliente_id?: string
          comentarios_especiales?: string | null
          comision_app?: number | null
          costo_adicionales?: number | null
          costo_entrega?: number | null
          costo_recoleccion?: number | null
          cotizacion_especial?: boolean
          created_at?: string
          destino?: string | null
          estatus?: string | null
          fecha_llegada?: string | null
          fecha_salida?: string | null
          folio?: string | null
          horario_carga?: string | null
          horario_entrega?: string | null
          id?: string
          margen_negocio?: number | null
          modalidad?: string | null
          modalidad_sugerida?: string | null
          observaciones?: string | null
          origen?: string | null
          peso?: number | null
          porcentaje_urgencia?: number
          precio_base?: number | null
          precio_total?: number | null
          presupuesto_cliente?: number | null
          proveedor_id?: string | null
          seguro_costo?: number | null
          seguro_monto?: number | null
          seguro_porcentaje?: number | null
          tipo_servicio?: string | null
          unidad_sugerida?: string | null
          updated_at?: string
          urgencia?: boolean
          visita_ocular?: boolean
          volumen_cobrable?: number | null
          volumen_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_calendario: {
        Row: {
          cliente_id: string | null
          color: string | null
          cotizacion_id: string | null
          created_at: string
          estatus: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          observaciones: string | null
          proveedor_id: string | null
          titulo: string | null
        }
        Insert: {
          cliente_id?: string | null
          color?: string | null
          cotizacion_id?: string | null
          created_at?: string
          estatus?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          observaciones?: string | null
          proveedor_id?: string | null
          titulo?: string | null
        }
        Update: {
          cliente_id?: string | null
          color?: string | null
          cotizacion_id?: string | null
          created_at?: string
          estatus?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          observaciones?: string | null
          proveedor_id?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_calendario_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_calendario_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_calendario_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_calendario_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      evidencias_servicio: {
        Row: {
          cotizacion_id: string | null
          created_at: string
          descripcion: string | null
          id: string
          orden_id: string | null
          subido_por: string | null
          tipo: string
          url: string
        }
        Insert: {
          cotizacion_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          orden_id?: string | null
          subido_por?: string | null
          tipo: string
          url: string
        }
        Update: {
          cotizacion_id?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          orden_id?: string | null
          subido_por?: string | null
          tipo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_servicio_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencias_servicio_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      expedientes_servicio: {
        Row: {
          cliente_id: string | null
          comprobante_pago_url: string | null
          cotizacion_id: string | null
          created_at: string
          estatus: string | null
          id: string
          orden_servicio_id: string | null
          poliza_seguro_url: string | null
        }
        Insert: {
          cliente_id?: string | null
          comprobante_pago_url?: string | null
          cotizacion_id?: string | null
          created_at?: string
          estatus?: string | null
          id?: string
          orden_servicio_id?: string | null
          poliza_seguro_url?: string | null
        }
        Update: {
          cliente_id?: string | null
          comprobante_pago_url?: string | null
          cotizacion_id?: string | null
          created_at?: string
          estatus?: string | null
          id?: string
          orden_servicio_id?: string | null
          poliza_seguro_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_servicio_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_servicio_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_servicio_orden_servicio_id_fkey"
            columns: ["orden_servicio_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      folio_counters: {
        Row: {
          id: number
          seq: number
          yyyymmdd: string
        }
        Insert: {
          id?: number
          seq?: number
          yyyymmdd: string
        }
        Update: {
          id?: number
          seq?: number
          yyyymmdd?: string
        }
        Relationships: []
      }
      folio_counters_v3g: {
        Row: {
          id: number
          seq: number
          yyyymmdd: string
        }
        Insert: {
          id?: never
          seq?: number
          yyyymmdd: string
        }
        Update: {
          id?: never
          seq?: number
          yyyymmdd?: string
        }
        Relationships: []
      }
      horarios_visita_proveedor: {
        Row: {
          activo: boolean
          created_at: string
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id: string
          proveedor_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          dia_semana: number
          hora_fin?: string
          hora_inicio?: string
          id?: string
          proveedor_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          dia_semana?: number
          hora_fin?: string
          hora_inicio?: string
          id?: string
          proveedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_visita_proveedor_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horarios_visita_proveedor_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      incidencias: {
        Row: {
          cliente_id: string | null
          cotizacion_id: string | null
          created_at: string
          descripcion: string | null
          estatus: string | null
          fecha_limite_reembolso: string | null
          fecha_reporte: string
          id: string
          negligencia_proveedor: boolean
          proveedor_id: string | null
          reportada_en_app: boolean
          requiere_reembolso: boolean
          tipo_incidencia: string | null
        }
        Insert: {
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string
          descripcion?: string | null
          estatus?: string | null
          fecha_limite_reembolso?: string | null
          fecha_reporte?: string
          id?: string
          negligencia_proveedor?: boolean
          proveedor_id?: string | null
          reportada_en_app?: boolean
          requiere_reembolso?: boolean
          tipo_incidencia?: string | null
        }
        Update: {
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string
          descripcion?: string | null
          estatus?: string | null
          fecha_limite_reembolso?: string | null
          fecha_reporte?: string
          id?: string
          negligencia_proveedor?: boolean
          proveedor_id?: string | null
          reportada_en_app?: boolean
          requiere_reembolso?: boolean
          tipo_incidencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidencias_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      incidencias_evidencias: {
        Row: {
          archivo_url: string | null
          comentario: string | null
          created_at: string
          id: string
          incidencia_id: string
          tipo_archivo: string | null
        }
        Insert: {
          archivo_url?: string | null
          comentario?: string | null
          created_at?: string
          id?: string
          incidencia_id: string
          tipo_archivo?: string | null
        }
        Update: {
          archivo_url?: string | null
          comentario?: string | null
          created_at?: string
          id?: string
          incidencia_id?: string
          tipo_archivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidencias_evidencias_incidencia_id_fkey"
            columns: ["incidencia_id"]
            isOneToOne: false
            referencedRelation: "incidencias"
            referencedColumns: ["id"]
          },
        ]
      }
      intereses_publicacion: {
        Row: {
          created_at: string
          estatus: string | null
          id: string
          proveedor_interesado_id: string
          publicacion_id: string
        }
        Insert: {
          created_at?: string
          estatus?: string | null
          id?: string
          proveedor_interesado_id: string
          publicacion_id: string
        }
        Update: {
          created_at?: string
          estatus?: string | null
          id?: string
          proveedor_interesado_id?: string
          publicacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intereses_publicacion_proveedor_interesado_id_fkey"
            columns: ["proveedor_interesado_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intereses_publicacion_proveedor_interesado_id_fkey"
            columns: ["proveedor_interesado_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intereses_publicacion_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_carga"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_items: {
        Row: {
          articulo: string | null
          cantidad: number | null
          categoria: string | null
          cotizacion_id: string
          created_at: string
          id: string
          m3_unitario: number | null
          subtotal_m3: number | null
        }
        Insert: {
          articulo?: string | null
          cantidad?: number | null
          categoria?: string | null
          cotizacion_id: string
          created_at?: string
          id?: string
          m3_unitario?: number | null
          subtotal_m3?: number | null
        }
        Update: {
          articulo?: string | null
          cantidad?: number | null
          categoria?: string | null
          cotizacion_id?: string
          created_at?: string
          id?: string
          m3_unitario?: number | null
          subtotal_m3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventario_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_v3g: {
        Row: {
          created_at: string
          destino: string
          fecha_tentativa: string | null
          folio: string
          id: string
          mensaje_adicional: string | null
          nombre: string
          origen: string
          piso_elevador: string | null
          telefono: string
          tipo_inmueble: string | null
          tipo_servicio: string | null
        }
        Insert: {
          created_at?: string
          destino: string
          fecha_tentativa?: string | null
          folio: string
          id?: string
          mensaje_adicional?: string | null
          nombre: string
          origen: string
          piso_elevador?: string | null
          telefono: string
          tipo_inmueble?: string | null
          tipo_servicio?: string | null
        }
        Update: {
          created_at?: string
          destino?: string
          fecha_tentativa?: string | null
          folio?: string
          id?: string
          mensaje_adicional?: string | null
          nombre?: string
          origen?: string
          piso_elevador?: string | null
          telefono?: string
          tipo_inmueble?: string | null
          tipo_servicio?: string | null
        }
        Relationships: []
      }
      mensajes_chat_publicacion: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          mensaje: string
          remitente_proveedor_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          mensaje: string
          remitente_proveedor_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          mensaje?: string
          remitente_proveedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_chat_publicacion_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats_publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_chat_publicacion_remitente_proveedor_id_fkey"
            columns: ["remitente_proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_chat_publicacion_remitente_proveedor_id_fkey"
            columns: ["remitente_proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_lead: {
        Row: {
          autor_id: string | null
          cliente_id: string | null
          contenido: string
          cotizacion_id: string | null
          created_at: string
          id: string
        }
        Insert: {
          autor_id?: string | null
          cliente_id?: string | null
          contenido: string
          cotizacion_id?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          autor_id?: string | null
          cliente_id?: string | null
          contenido?: string
          cotizacion_id?: string | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_lead_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_lead_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_servicio: {
        Row: {
          aceptado_proveedor: boolean | null
          contrato_url: string | null
          cotizacion_id: string
          created_at: string
          estatus: string | null
          evidencias_carga: boolean | null
          evidencias_entrega: boolean | null
          fecha_aceptacion_proveedor: string | null
          fecha_asignacion: string | null
          firma_cliente: boolean | null
          folio: string | null
          id: string
          notas_cierre: string | null
          origen_asignacion: string | null
          pago_completo: boolean | null
          pdf_url: string | null
          proveedor_id: string | null
          unidad_asignada_id: string | null
        }
        Insert: {
          aceptado_proveedor?: boolean | null
          contrato_url?: string | null
          cotizacion_id: string
          created_at?: string
          estatus?: string | null
          evidencias_carga?: boolean | null
          evidencias_entrega?: boolean | null
          fecha_aceptacion_proveedor?: string | null
          fecha_asignacion?: string | null
          firma_cliente?: boolean | null
          folio?: string | null
          id?: string
          notas_cierre?: string | null
          origen_asignacion?: string | null
          pago_completo?: boolean | null
          pdf_url?: string | null
          proveedor_id?: string | null
          unidad_asignada_id?: string | null
        }
        Update: {
          aceptado_proveedor?: boolean | null
          contrato_url?: string | null
          cotizacion_id?: string
          created_at?: string
          estatus?: string | null
          evidencias_carga?: boolean | null
          evidencias_entrega?: boolean | null
          fecha_aceptacion_proveedor?: string | null
          fecha_asignacion?: string | null
          firma_cliente?: boolean | null
          folio?: string | null
          id?: string
          notas_cierre?: string | null
          origen_asignacion?: string | null
          pago_completo?: boolean | null
          pdf_url?: string | null
          proveedor_id?: string | null
          unidad_asignada_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_servicio_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_unidad_asignada_id_fkey"
            columns: ["unidad_asignada_id"]
            isOneToOne: false
            referencedRelation: "proveedor_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          cliente_id: string | null
          comprobante_url: string | null
          cotizacion_id: string | null
          created_at: string
          estatus: string | null
          fecha_pago: string | null
          id: string
          metodo_pago: string | null
          moneda: string
          monto: number | null
          proveedor_id: string | null
          referencia: string | null
          tipo_pago: string | null
        }
        Insert: {
          cliente_id?: string | null
          comprobante_url?: string | null
          cotizacion_id?: string | null
          created_at?: string
          estatus?: string | null
          fecha_pago?: string | null
          id?: string
          metodo_pago?: string | null
          moneda?: string
          monto?: number | null
          proveedor_id?: string | null
          referencia?: string | null
          tipo_pago?: string | null
        }
        Update: {
          cliente_id?: string | null
          comprobante_url?: string | null
          cotizacion_id?: string | null
          created_at?: string
          estatus?: string | null
          fecha_pago?: string | null
          id?: string
          metodo_pago?: string | null
          moneda?: string
          monto?: number | null
          proveedor_id?: string | null
          referencia?: string | null
          tipo_pago?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedor_unidades: {
        Row: {
          activa: boolean
          capacidad_m3: number | null
          capacidad_peso: number | null
          created_at: string
          foto_url: string | null
          id: string
          observaciones: string | null
          placas: string | null
          proveedor_id: string
          tipo_unidad: string | null
        }
        Insert: {
          activa?: boolean
          capacidad_m3?: number | null
          capacidad_peso?: number | null
          created_at?: string
          foto_url?: string | null
          id?: string
          observaciones?: string | null
          placas?: string | null
          proveedor_id: string
          tipo_unidad?: string | null
        }
        Update: {
          activa?: boolean
          capacidad_m3?: number | null
          capacidad_peso?: number | null
          created_at?: string
          foto_url?: string | null
          id?: string
          observaciones?: string | null
          placas?: string | null
          proveedor_id?: string
          tipo_unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proveedor_unidades_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proveedor_unidades_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean
          adeudo_cliente_pendiente: number
          anios_experiencia: number | null
          calificacion: number | null
          ciudades_cobertura: string[] | null
          correo: string | null
          created_at: string
          cuota_reingreso_pendiente: number
          descripcion: string | null
          direccion: string | null
          direccion_operativa: string | null
          documentos_urls: string[] | null
          estatus: string | null
          id: string
          logo_url: string | null
          modalidades: string[] | null
          nombre_comercial: string
          premium_activo: boolean
          razon_social: string | null
          responsable_nombre: string | null
          rutas_frecuentes: string[] | null
          servicios_sin_anticipo_restantes: number
          supervision_especial: boolean
          tipos_servicio: string[] | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          activo?: boolean
          adeudo_cliente_pendiente?: number
          anios_experiencia?: number | null
          calificacion?: number | null
          ciudades_cobertura?: string[] | null
          correo?: string | null
          created_at?: string
          cuota_reingreso_pendiente?: number
          descripcion?: string | null
          direccion?: string | null
          direccion_operativa?: string | null
          documentos_urls?: string[] | null
          estatus?: string | null
          id?: string
          logo_url?: string | null
          modalidades?: string[] | null
          nombre_comercial: string
          premium_activo?: boolean
          razon_social?: string | null
          responsable_nombre?: string | null
          rutas_frecuentes?: string[] | null
          servicios_sin_anticipo_restantes?: number
          supervision_especial?: boolean
          tipos_servicio?: string[] | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          activo?: boolean
          adeudo_cliente_pendiente?: number
          anios_experiencia?: number | null
          calificacion?: number | null
          ciudades_cobertura?: string[] | null
          correo?: string | null
          created_at?: string
          cuota_reingreso_pendiente?: number
          descripcion?: string | null
          direccion?: string | null
          direccion_operativa?: string | null
          documentos_urls?: string[] | null
          estatus?: string | null
          id?: string
          logo_url?: string | null
          modalidades?: string[] | null
          nombre_comercial?: string
          premium_activo?: boolean
          razon_social?: string | null
          responsable_nombre?: string | null
          rutas_frecuentes?: string[] | null
          servicios_sin_anticipo_restantes?: number
          supervision_especial?: boolean
          tipos_servicio?: string[] | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      publicaciones_carga: {
        Row: {
          comision_app_publicador: number | null
          comision_app_tomador: number | null
          costo_ofrecido: number | null
          created_at: string
          destino: string | null
          estatus: string | null
          expira_at: string | null
          fecha_llegada_estimada: string | null
          fecha_salida: string | null
          id: string
          intereses_count: number
          modalidad_disponible: string | null
          observaciones: string | null
          origen: string | null
          peso_disponible: number | null
          proveedor_id: string
          tipo_oportunidad: string | null
          tipo_publicacion: string | null
          tipo_unidad: string | null
          vistas_cotizaciones: number
          volumen_disponible: number | null
        }
        Insert: {
          comision_app_publicador?: number | null
          comision_app_tomador?: number | null
          costo_ofrecido?: number | null
          created_at?: string
          destino?: string | null
          estatus?: string | null
          expira_at?: string | null
          fecha_llegada_estimada?: string | null
          fecha_salida?: string | null
          id?: string
          intereses_count?: number
          modalidad_disponible?: string | null
          observaciones?: string | null
          origen?: string | null
          peso_disponible?: number | null
          proveedor_id: string
          tipo_oportunidad?: string | null
          tipo_publicacion?: string | null
          tipo_unidad?: string | null
          vistas_cotizaciones?: number
          volumen_disponible?: number | null
        }
        Update: {
          comision_app_publicador?: number | null
          comision_app_tomador?: number | null
          costo_ofrecido?: number | null
          created_at?: string
          destino?: string | null
          estatus?: string | null
          expira_at?: string | null
          fecha_llegada_estimada?: string | null
          fecha_salida?: string | null
          id?: string
          intereses_count?: number
          modalidad_disponible?: string | null
          observaciones?: string | null
          origen?: string | null
          peso_disponible?: number | null
          proveedor_id?: string
          tipo_oportunidad?: string | null
          tipo_publicacion?: string | null
          tipo_unidad?: string | null
          vistas_cotizaciones?: number
          volumen_disponible?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publicaciones_carga_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_carga_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      reembolsos: {
        Row: {
          cliente_id: string | null
          cotizacion_id: string | null
          created_at: string
          estatus: string | null
          evidencia_url: string | null
          fecha_cumplimiento: string | null
          fecha_limite: string | null
          id: string
          incidencia_id: string | null
          monto: number | null
          proveedor_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string
          estatus?: string | null
          evidencia_url?: string | null
          fecha_cumplimiento?: string | null
          fecha_limite?: string | null
          id?: string
          incidencia_id?: string | null
          monto?: number | null
          proveedor_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string
          estatus?: string | null
          evidencia_url?: string | null
          fecha_cumplimiento?: string | null
          fecha_limite?: string | null
          id?: string
          incidencia_id?: string | null
          monto?: number | null
          proveedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reembolsos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reembolsos_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reembolsos_incidencia_id_fkey"
            columns: ["incidencia_id"]
            isOneToOne: false
            referencedRelation: "incidencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reembolsos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reembolsos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      rutas: {
        Row: {
          activa: boolean
          costo_m3: number
          created_at: string
          destino: string
          es_directa: boolean
          id: string
          notas: string | null
          origen: string
        }
        Insert: {
          activa?: boolean
          costo_m3: number
          created_at?: string
          destino: string
          es_directa?: boolean
          id?: string
          notas?: string | null
          origen: string
        }
        Update: {
          activa?: boolean
          costo_m3?: number
          created_at?: string
          destino?: string
          es_directa?: boolean
          id?: string
          notas?: string | null
          origen?: string
        }
        Relationships: []
      }
      sanciones_proveedor: {
        Row: {
          bloqueado: boolean
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          monto_adeudo: number | null
          monto_reingreso: number | null
          motivo: string | null
          proveedor_id: string
          servicios_sin_anticipo: number
          supervision_especial: boolean
        }
        Insert: {
          bloqueado?: boolean
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          monto_adeudo?: number | null
          monto_reingreso?: number | null
          motivo?: string | null
          proveedor_id: string
          servicios_sin_anticipo?: number
          supervision_especial?: boolean
        }
        Update: {
          bloqueado?: boolean
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          monto_adeudo?: number | null
          monto_reingreso?: number | null
          motivo?: string | null
          proveedor_id?: string
          servicios_sin_anticipo?: number
          supervision_especial?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sanciones_proveedor_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanciones_proveedor_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      seguimientos: {
        Row: {
          cliente_id: string
          cotizacion_id: string
          created_at: string
          estatus: string
          fecha_completado: string | null
          fecha_programada: string
          id: string
          mensaje: string | null
          notas: string | null
          tipo: string
        }
        Insert: {
          cliente_id: string
          cotizacion_id: string
          created_at?: string
          estatus?: string
          fecha_completado?: string | null
          fecha_programada: string
          id?: string
          mensaje?: string | null
          notas?: string | null
          tipo?: string
        }
        Update: {
          cliente_id?: string
          cotizacion_id?: string
          created_at?: string
          estatus?: string
          fecha_completado?: string | null
          fecha_programada?: string
          id?: string
          mensaje?: string | null
          notas?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguimientos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimientos_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_visita: {
        Row: {
          cliente_id: string | null
          cotizacion_id: string | null
          created_at: string
          direccion: string | null
          estatus: string
          fecha_solicitada: string
          hora_solicitada: string | null
          id: string
          notas: string | null
          proveedor_id: string
        }
        Insert: {
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string
          direccion?: string | null
          estatus?: string
          fecha_solicitada: string
          hora_solicitada?: string | null
          id?: string
          notas?: string | null
          proveedor_id: string
        }
        Update: {
          cliente_id?: string | null
          cotizacion_id?: string | null
          created_at?: string
          direccion?: string | null
          estatus?: string
          fecha_solicitada?: string
          hora_solicitada?: string | null
          id?: string
          notas?: string | null
          proveedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_visita_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_visita_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_visita_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_visita_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones_proveedor: {
        Row: {
          autopause: boolean
          created_at: string
          estatus: string | null
          fecha_inicio: string | null
          fecha_renovacion: string | null
          fecha_suspension: string | null
          id: string
          monto_mensual: number | null
          plan: string | null
          proveedor_id: string
        }
        Insert: {
          autopause?: boolean
          created_at?: string
          estatus?: string | null
          fecha_inicio?: string | null
          fecha_renovacion?: string | null
          fecha_suspension?: string | null
          id?: string
          monto_mensual?: number | null
          plan?: string | null
          proveedor_id: string
        }
        Update: {
          autopause?: boolean
          created_at?: string
          estatus?: string | null
          fecha_inicio?: string | null
          fecha_renovacion?: string | null
          fecha_suspension?: string | null
          id?: string
          monto_mensual?: number | null
          plan?: string | null
          proveedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_proveedor_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripciones_proveedor_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      user_identities: {
        Row: {
          cliente_id: string | null
          created_at: string
          is_admin: boolean
          proveedor_id: string | null
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          is_admin?: boolean
          proveedor_id?: string | null
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          is_admin?: boolean
          proveedor_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_identities_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_identities_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_identities_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          bsuid: string
          created_at: string
          id: string
          last_message_at: string | null
          lead_id: string | null
          nombre: string | null
          telefono_whatsapp: string | null
        }
        Insert: {
          bsuid: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          nombre?: string | null
          telefono_whatsapp?: string | null
        }
        Update: {
          bsuid?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          nombre?: string | null
          telefono_whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_v3g"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_inbox: {
        Row: {
          id: string
          message_type: string
          origin: string | null
          phone_number_id: string
          raw_payload: Json
          received_at: string
          user_display_name: string | null
          user_phone: string | null
          username: string | null
          vcard: string | null
          wa_message_id: string
          wa_user_id: string | null
        }
        Insert: {
          id?: string
          message_type: string
          origin?: string | null
          phone_number_id: string
          raw_payload: Json
          received_at?: string
          user_display_name?: string | null
          user_phone?: string | null
          username?: string | null
          vcard?: string | null
          wa_message_id: string
          wa_user_id?: string | null
        }
        Update: {
          id?: string
          message_type?: string
          origin?: string | null
          phone_number_id?: string
          raw_payload?: Json
          received_at?: string
          user_display_name?: string | null
          user_phone?: string | null
          username?: string | null
          vcard?: string | null
          wa_message_id?: string
          wa_user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body: string | null
          contact_id: string
          created_at: string
          direction: string
          id: string
          message_id: string | null
          raw_payload: Json | null
        }
        Insert: {
          body?: string | null
          contact_id: string
          created_at?: string
          direction: string
          id?: string
          message_id?: string | null
          raw_payload?: Json | null
        }
        Update: {
          body?: string | null
          contact_id?: string
          created_at?: string
          direction?: string
          id?: string
          message_id?: string | null
          raw_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      zonas_restringidas: {
        Row: {
          camioneta_forzosa: boolean
          ciudad: string
          clave_requerida: boolean
          condicion: string | null
          costo_extra: number | null
          created_at: string
          id: string
          notas: string | null
        }
        Insert: {
          camioneta_forzosa?: boolean
          ciudad: string
          clave_requerida?: boolean
          condicion?: string | null
          costo_extra?: number | null
          created_at?: string
          id?: string
          notas?: string | null
        }
        Update: {
          camioneta_forzosa?: boolean
          ciudad?: string
          clave_requerida?: boolean
          condicion?: string | null
          costo_extra?: number | null
          created_at?: string
          id?: string
          notas?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      calificaciones_publico: {
        Row: {
          comentario: string | null
          created_at: string | null
          cuidado_carga: number | null
          cumplimiento: number | null
          experiencia_general: number | null
          id: string | null
          promedio: number | null
          proveedor_id: string | null
          puntualidad: number | null
          trato: number | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          cuidado_carga?: number | null
          cumplimiento?: number | null
          experiencia_general?: number | null
          id?: string | null
          promedio?: number | null
          proveedor_id?: string | null
          puntualidad?: number | null
          trato?: number | null
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          cuidado_carga?: number | null
          cumplimiento?: number | null
          experiencia_general?: number | null
          id?: string | null
          promedio?: number | null
          proveedor_id?: string | null
          puntualidad?: number | null
          trato?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "calificaciones_servicio_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificaciones_servicio_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores_publico: {
        Row: {
          activo: boolean | null
          calificacion: number | null
          ciudades_cobertura: string[] | null
          id: string | null
          logo_url: string | null
          nombre_comercial: string | null
          premium_activo: boolean | null
          rutas_frecuentes: string[] | null
        }
        Insert: {
          activo?: boolean | null
          calificacion?: number | null
          ciudades_cobertura?: string[] | null
          id?: string | null
          logo_url?: string | null
          nombre_comercial?: string | null
          premium_activo?: boolean | null
          rutas_frecuentes?: string[] | null
        }
        Update: {
          activo?: boolean | null
          calificacion?: number | null
          ciudades_cobertura?: string[] | null
          id?: string | null
          logo_url?: string | null
          nombre_comercial?: string | null
          premium_activo?: boolean | null
          rutas_frecuentes?: string[] | null
        }
        Relationships: []
      }
      rutas_publico: {
        Row: {
          activa: boolean | null
          destino: string | null
          es_directa: boolean | null
          id: string | null
          notas: string | null
          origen: string | null
        }
        Insert: {
          activa?: boolean | null
          destino?: string | null
          es_directa?: boolean | null
          id?: string | null
          notas?: string | null
          origen?: string | null
        }
        Update: {
          activa?: boolean | null
          destino?: string | null
          es_directa?: boolean | null
          id?: string | null
          notas?: string | null
          origen?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      compute_reputation_level: {
        Args: { p_proveedor_id: string }
        Returns: string
      }
      desbloquear_chat: { Args: { p_chat_id: string }; Returns: undefined }
      expire_publicaciones_now: { Args: never; Returns: number }
      guardar_aceptacion: {
        Args: {
          p_cliente_id: string
          p_cotizacion_id: string
          p_ip: string
          p_user_agent: string
        }
        Returns: undefined
      }
      init_user_identity: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      link_user_identity: {
        Args: { p_cliente_id?: string; p_proveedor_id?: string }
        Returns: Json
      }
      next_folio: { Args: never; Returns: string }
      next_folio_v3g: { Args: never; Returns: string }
      obtener_proveedores_disponibles: {
        Args: { p_destino: string; p_fecha: string; p_origen: string }
        Returns: {
          calificacion: number
          disponible: boolean
          nombre: string
          proveedor_id: string
        }[]
      }
      obtener_proveedores_priorizados: {
        Args: {
          p_destino: string
          p_fecha: string
          p_origen: string
          p_tipo_servicio: string
          p_volumen: number
        }
        Returns: {
          calificacion: number
          logo_url: string
          nombre_comercial: string
          oportunidad: boolean
          proveedor_id: string
          score: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

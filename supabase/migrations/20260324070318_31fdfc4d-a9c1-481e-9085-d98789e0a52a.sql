
UPDATE storage.buckets SET public = true WHERE id = 'ordenes-servicio';

CREATE POLICY "ordenes_servicio_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ordenes-servicio');

CREATE POLICY "ordenes_servicio_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ordenes-servicio');

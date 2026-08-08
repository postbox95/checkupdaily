CREATE POLICY "ads storage admin read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "ads storage admin insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "ads storage admin update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "ads storage admin delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'ads' AND has_role(auth.uid(), 'admin'::app_role));
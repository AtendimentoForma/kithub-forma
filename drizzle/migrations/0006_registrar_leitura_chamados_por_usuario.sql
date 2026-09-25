CREATE TABLE public.chamado_leituras (
  usuario_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chamado_numero bigint NOT NULL REFERENCES public.chamados(numero) ON DELETE CASCADE,
  visto_em timestamptz NOT NULL,
  PRIMARY KEY (usuario_id, chamado_numero)
);
GRANT SELECT, INSERT, UPDATE ON public.chamado_leituras TO authenticated;
GRANT ALL ON public.chamado_leituras TO service_role;
ALTER TABLE public.chamado_leituras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario consulta suas leituras" ON public.chamado_leituras FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Usuario registra sua leitura" ON public.chamado_leituras FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Usuario atualiza sua leitura" ON public.chamado_leituras FOR UPDATE TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
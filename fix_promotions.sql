-- =====================================================================
-- CORRECTION FINALE: RPC activate_product_promotion
-- =====================================================================
BEGIN;

-- 1. Révoquer les droits d'exécution de TOUT LE MONDE (public inclut anon et authenticated)
REVOKE EXECUTE ON FUNCTION public.activate_product_promotion(uuid, integer, text, text, numeric) FROM public;
REVOKE EXECUTE ON FUNCTION public.activate_product_promotion(uuid, integer, text, text, numeric) FROM anon;

-- 2. Redonner les droits d'exécution UNIQUEMENT aux utilisateurs connectés (authenticated)
-- (Car le frontend appelle cette fonction quand un vendeur paie sa promotion)
GRANT EXECUTE ON FUNCTION public.activate_product_promotion(uuid, integer, text, text, numeric) TO authenticated;

COMMIT;

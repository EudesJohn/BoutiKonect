-- Migration: Ajouter l'avatar du rédacteur dans les avis
BEGIN;

ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS reviewer_avatar TEXT;

-- Mettre à jour les avis existants si possible (optionnel mais recommandé)
UPDATE public.reviews r
SET reviewer_avatar = p.avatar
FROM public.profiles p
WHERE r.reviewer_id = p.id;

COMMIT;

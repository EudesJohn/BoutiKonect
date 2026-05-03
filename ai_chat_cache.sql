-- Table pour mémoriser les réponses de l'IA (Cache)
CREATE TABLE IF NOT EXISTS ai_chat_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_hash TEXT UNIQUE NOT NULL, -- Hash de la question normalisée
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    hit_count INTEGER DEFAULT 1, -- Nombre de fois que cette réponse a été réutilisée
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_hit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour des recherches ultra-rapides
CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_chat_cache(query_hash);

-- RLS : Seul le serveur peut lire/écrire (via la clé service_role ou anon si configuré)
ALTER TABLE ai_chat_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to cache" ON ai_chat_cache FOR SELECT USING (true);
CREATE POLICY "Server insert access to cache" ON ai_chat_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Server update access to cache" ON ai_chat_cache FOR UPDATE USING (true);

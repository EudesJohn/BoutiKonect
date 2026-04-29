const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const Joi = require('joi');
const { rateLimiter } = require('../utils/rateLimit');
const { validateAdminAction } = require('../utils/validation');
const { withLogging } = require('../utils/withLogging');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSecret = process.env.ADMIN_API_KEY;

function safeCompare(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

module.exports = async (req, res) => {
  return withLogging(async (req, res) => {
    // Rate limiting for admin endpoint
    if (!rateLimiter(req, res)) return; // response handled inside

    const authHeader = req.headers.authorization;
    if (!adminSecret || !authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Accès non autorisé' });
    }
    const token = authHeader.slice(7);
    if (!safeCompare(token, adminSecret)) {
      return res.status(401).json({ error: 'Accès non autorisé' });
    }
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Configuration Supabase manquante' });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { action } = req.body || req.query;
    // Validate request body based on action
    const { error, value } = validateAdminAction(req.body || {});
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    try {
      switch (action) {
        case 'promote': {
          const { email } = value;
          const { data: profile, error: findError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();
          if (findError) throw findError;
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_admin: true, role: 'admin' })
            .eq('id', profile.id);
          if (updateError) throw updateError;
          return res.status(200).json({ success: true, message: `${email} promu admin` });
        }
        case 'deleteUser': {
          const { userId } = value;
          const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
          if (deleteError) throw deleteError;
          return res.status(200).json({ success: true, message: `Utilisateur ${userId} supprimé` });
        }
        default:
          return res.status(400).json({ error: 'Action non reconnue' });
      }
    } catch (err) {
      console.error('Admin API error:', err);
      return res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
    }
  })(req, res);
};
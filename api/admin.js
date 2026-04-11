const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async (req, res) => {
  // Sécurité obligatoire pour l'admin car touches au service_role
  const authHeader = req.headers.authorization;
  const adminSecret = process.env.ADMIN_API_KEY;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return res.status(401).json({ error: 'Accès non autorisé' });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Configuration Supabase manquante' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { action, userId, email } = req.body || req.query;

  try {
    switch (action) {
      case 'promote':
        if (!email) return res.status(400).json({ error: 'Email requis pour promotion' });
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

      case 'deleteUser':
        if (!userId) return res.status(400).json({ error: 'userId requis pour suppression' });
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;
        return res.status(200).json({ success: true, message: `Utilisateur ${userId} supprimé` });

      default:
        return res.status(400).json({ error: 'Action non reconnue' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

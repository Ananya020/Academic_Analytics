
import { supabase } from '../config/supabaseClient.js';

export const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided. Authorization denied.' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }

        // Fetch user profile from public.users table to get role and other details
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (profileError || !userProfile) {
            return res.status(404).json({ error: 'User profile not found.' });
        }

        req.user = userProfile;
        next();
    } catch (err) {
        res.status(500).json({ error: 'Server error during authentication.' });
    }
};

export const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: You do not have the required permissions.' });
        }
        next();
    };
};

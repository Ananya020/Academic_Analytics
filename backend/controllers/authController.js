
import { supabase, supabaseAdmin } from '../config/supabaseClient.js';

export const registerUser = async (req, res) => {
    const { email, password, name, role } = req.body;

    // Validation
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    if (!role || !['FA', 'AA', 'HOD', 'ADMIN'].includes(role.toUpperCase())) {
        return res.status(400).json({ error: 'Valid role is required (FA, AA, HOD, ADMIN).' });
    }

    try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        if (!authData.user) {
            return res.status(500).json({ error: 'Failed to create user account.' });
        }

        // Create user profile in public.users table
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                email: email.toLowerCase(),
                name: name.trim(),
                role: role.toUpperCase(),
                section_id: null, // Admin can assign section later
            })
            .select()
            .single();

        if (profileError) {
            // If profile creation fails, try to delete the auth user
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return res.status(500).json({ error: 'Failed to create user profile: ' + profileError.message });
        }

        // Sign in the user to get session token
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError || !signInData.session) {
            return res.status(200).json({
                message: 'Registration successful. Please sign in.',
                token: null,
                user: {
                    id: authData.user.id,
                    email: authData.user.email,
                    role: userProfile.role,
                    name: userProfile.name
                }
            });
        }

        res.status(201).json({
            message: 'Registration successful',
            token: signInData.session.access_token,
            user: {
                id: authData.user.id,
                email: authData.user.email,
                role: userProfile.role.toLowerCase(), // Convert to lowercase for frontend
                name: userProfile.name
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'An unexpected error occurred during registration.' });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        // Fetch user role from public.users table
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('role, name')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
             return res.status(500).json({ error: 'Could not fetch user profile.' });
        }

        res.status(200).json({ 
            message: 'Login successful', 
            token: data.session.access_token,
            user: {
                id: data.user.id,
                email: data.user.email,
                role: userProfile.role.toLowerCase(), // Convert to lowercase for frontend
                name: userProfile.name
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'An unexpected error occurred.' });
    }
};

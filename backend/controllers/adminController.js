
import { supabaseAdmin, supabase } from '../config/supabaseClient.js';

// Create a new user (FA, AA, HOD, ADMIN)
export const createUser = async (req, res) => {
    const { email, password, name, role, department, section_id } = req.body;
    
    if (!email || !password || !name || !role) {
        return res.status(400).json({ error: 'Missing required fields: email, password, name, role.' });
    }

    try {
        const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role, department }
        });

        if (error) throw error;
        
        // If it's an FA and a section_id is provided, update their profile
        if (role === 'FA' && section_id) {
            const { error: updateError } = await supabase
                .from('users')
                .update({ section_id })
                .eq('id', user.id);
            if (updateError) console.error("Error updating user's section:", updateError.message);
        }

        res.status(201).json({ message: 'User created successfully', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all users, with optional filtering by role
export const getUsers = async (req, res) => {
    const { role } = req.query;
    try {
        let query = supabase.from('users').select('*');
        if (role) {
            // Support comma-separated roles (e.g., "fa,aa")
            const roles = role.split(',').map(r => r.trim().toUpperCase());
            if (roles.length === 1) {
                query = query.eq('role', roles[0]);
            } else {
                query = query.in('role', roles);
            }
        }
        const { data, error } = await query;
        if (error) throw error;
        res.status(200).json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update user details
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, role, department, section_id } = req.body;
    
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ name, role, department, section_id })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ error: 'User not found.' });

        res.status(200).json({ message: 'User updated successfully', user: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a user
export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw error;
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all sections
export const getSections = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sections')
            .select('id, name, year, department, advisor_id');
        if (error) throw error;
        
        // Sort sections: A1-Z1, then A2-Z2, etc.
        const sorted = (data || []).sort((a, b) => {
            const nameA = a.name || "";
            const nameB = b.name || "";
            
            // Extract letter and number from format like "A1", "B2", etc.
            const matchA = nameA.match(/^([A-Z])(\d+)$/);
            const matchB = nameB.match(/^([A-Z])(\d+)$/);
            
            if (matchA && matchB) {
                const numA = parseInt(matchA[2]);
                const numB = parseInt(matchB[2]);
                // Sort by number first (1, 2, 3, 4), then by letter (A-Z)
                if (numA !== numB) {
                    return numA - numB;
                }
                return matchA[1].localeCompare(matchB[1]);
            }
            // Fallback to alphabetical if format doesn't match
            return nameA.localeCompare(nameB);
        });
        
        res.status(200).json(sorted);
    } catch (err) {
        console.error('Get sections error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Create default sections (A1-Z1, A2-Z2, etc.) - optional helper endpoint
export const createDefaultSections = async (req, res) => {
    try {
        const { year = 2024, department = 'Computer Science' } = req.body;
        
        const sections = [];
        for (let yearNum = 1; yearNum <= 4; yearNum++) {
            for (let i = 0; i < 26; i++) {
                const letter = String.fromCharCode(65 + i); // A-Z
                sections.push({
                    name: `${letter}${yearNum}`,
                    year: year + yearNum - 1,
                    department: department,
                });
            }
        }
        
        const { data, error } = await supabase
            .from('sections')
            .insert(sections)
            .select();
        
        if (error) throw error;
        
        res.status(201).json({ 
            message: `Created ${sections.length} sections`,
            sections: data 
        });
    } catch (err) {
        console.error('Create sections error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get current mappings (users with their sections)
export const getMappings = async (req, res) => {
    try {
        // Get all FA and AA users with their section assignments
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, role, section_id')
            .in('role', ['FA', 'AA']);
        
        if (usersError) throw usersError;
        
        // Get all sections
        const { data: sections, error: sectionsError } = await supabase
            .from('sections')
            .select('id, name, advisor_id');
        
        if (sectionsError) throw sectionsError;
        
        // Build mappings
        const mappings = [];
        
        // FA mappings (FA has section_id)
        users.filter(u => u.role === 'FA' && u.section_id).forEach(user => {
            const section = sections.find(s => s.id === user.section_id);
            if (section) {
                mappings.push({
                    userId: user.id,
                    userName: user.name,
                    userRole: user.role,
                    sections: [section.name || `Section ${section.id}`]
                });
            }
        });
        
        // AA mappings (AA has advisor_id in sections)
        users.filter(u => u.role === 'AA').forEach(user => {
            const userSections = sections
                .filter(s => s.advisor_id === user.id)
                .map(s => s.name || `Section ${s.id}`);
            
            if (userSections.length > 0) {
                mappings.push({
                    userId: user.id,
                    userName: user.name,
                    userRole: user.role,
                    sections: userSections
                });
            }
        });
        
        res.status(200).json(mappings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Map user to section(s) - updated to handle new frontend format
export const mapUserToSection = async (req, res) => {
    const { userId, sections, sectionId, type } = req.body;

    try {
        // Validate input
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        if (!sections && !sectionId) {
            return res.status(400).json({ error: 'Section ID(s) are required.' });
        }

        // Get user to determine role
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role, name')
            .eq('id', userId)
            .single();
        
        if (userError || !user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        const userRole = user.role;
        
        // Support both old format (sectionId, type) and new format (sections array)
        if (sections && Array.isArray(sections) && sections.length > 0) {
            // New format: sections is an array
            const sectionIdToUse = sections[0]; // FA gets one section, AA can get multiple
            
            // Validate section exists
            const { data: sectionData, error: sectionCheckError } = await supabase
                .from('sections')
                .select('id, name')
                .eq('id', sectionIdToUse)
                .single();
            
            if (sectionCheckError || !sectionData) {
                return res.status(404).json({ error: `Section with ID ${sectionIdToUse} not found.` });
            }
            
            if (userRole === 'FA') {
                // FA gets assigned to a single section
                const { error: userUpdateError } = await supabase
                    .from('users')
                    .update({ section_id: sectionIdToUse })
                    .eq('id', userId);
                if (userUpdateError) {
                    console.error('User update error:', userUpdateError);
                    throw userUpdateError;
                }

                // Update the advisor_id in the sections table
                const { error: sectionUpdateError } = await supabase
                    .from('sections')
                    .update({ advisor_id: userId })
                    .eq('id', sectionIdToUse);
                if (sectionUpdateError) {
                    console.error('Section update error:', sectionUpdateError);
                    throw sectionUpdateError;
                }
            } else if (userRole === 'AA') {
                // AA gets assigned as advisor to section(s)
                for (const secId of sections) {
                    // Validate each section exists
                    const { data: secData, error: secCheckError } = await supabase
                        .from('sections')
                        .select('id')
                        .eq('id', secId)
                        .single();
                    
                    if (secCheckError || !secData) {
                        return res.status(404).json({ error: `Section with ID ${secId} not found.` });
                    }
                    
                    const { error } = await supabase
                        .from('sections')
                        .update({ advisor_id: userId })
                        .eq('id', secId);
                    if (error) {
                        console.error(`Error updating section ${secId}:`, error);
                        throw error;
                    }
                }
            } else {
                return res.status(400).json({ error: 'Only FA and AA users can be mapped to sections.' });
            }
        } else if (sectionId && type) {
            // Old format: sectionId and type
            if (type === 'FA_TO_SECTION') {
                const { error: userUpdateError } = await supabase
                    .from('users')
                    .update({ section_id: sectionId })
                    .eq('id', userId);
                if (userUpdateError) throw userUpdateError;

                const { error: sectionUpdateError } = await supabase
                    .from('sections')
                    .update({ advisor_id: userId })
                    .eq('id', sectionId);
                if (sectionUpdateError) throw sectionUpdateError;
            } else if (type === 'AA_TO_SECTION') {
                const { error } = await supabase
                    .from('sections')
                    .update({ advisor_id: userId })
                    .eq('id', sectionId);
                if (error) throw error;
            } else {
                return res.status(400).json({ error: 'Invalid mapping type specified.' });
            }
        } else {
            return res.status(400).json({ error: 'Either sections array or sectionId and type must be provided.' });
        }
        
        res.status(200).json({ 
            message: `Successfully mapped ${user.name} (${userRole}) to section(s).` 
        });
    } catch (err) {
        console.error('Mapping error:', err);
        res.status(500).json({ error: err.message || 'An error occurred while mapping user to section.' });
    }
};

// Get audit logs
export const getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50; // Items per page
        const offset = (page - 1) * limit;
        
        // Get total count for pagination
        const { count, error: countError } = await supabase
            .from('audit_logs')
            .select('*', { count: 'exact', head: true });
        
        if (countError) throw countError;
        
        // Get paginated logs - use 'timestamp' not 'created_at'
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) throw error;
        
        // Map database fields to frontend expected format
        const mappedLogs = (data || []).map(log => ({
            id: log.id.toString(),
            userId: log.user_id || '',
            action: log.action || '',
            resource: log.target || '', // Map 'target' to 'resource'
            timestamp: log.timestamp || log.created_at || new Date().toISOString(),
            details: log.details || null
        }));
        
        res.status(200).json(mappedLogs);
    } catch (err) {
        console.error('Audit logs error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch audit logs' });
    }
};

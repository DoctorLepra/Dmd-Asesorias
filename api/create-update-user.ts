import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Missing Supabase environment variables' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    // Vercel parses body automatically
    const { userId, email, password, role, fullName, company, contactNumber } = req.body || {};

    try {
        if (userId) { // --- UPDATE USER ---
            const { data: user, error: userUpdateError } = await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { full_name: fullName, company, contact_number: contactNumber },
            });
            if (userUpdateError) throw userUpdateError;

            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({ role, full_name: fullName, company, contact_number: contactNumber })
                .eq('id', userId);
            if (profileUpdateError) throw profileUpdateError;

            return res.status(200).json({ message: 'User updated successfully' });

        } else { // --- CREATE USER ---
            if (!email || !password || !role) {
                return res.status(400).json({ error: 'Email, password, and role are required for new users' });
            }

            const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true, // User will need to confirm their email
                user_metadata: { full_name: fullName, company, contact_number: contactNumber, role },
            });

            if (createError) throw createError;
            if (!user) throw new Error("User creation did not return a user object.");

            // The handle_new_user trigger in Supabase will create the profile,
            // but we might need to set the role explicitly if it's not VISITOR.
            if (role !== 'VISITOR') {
                 const { error: profileUpdateError } = await supabase
                    .from('profiles')
                    .update({ role })
                    .eq('id', user.id);
                if (profileUpdateError) {
                    console.warn(`User created, but failed to set role for ${user.id}: ${profileUpdateError.message}`);
                }
            }

            return res.status(201).json({ message: 'User created successfully', user });
        }
    } catch (error: any) {
        console.error('Error in create-update-user function:', error);
        return res.status(500).json({ error: error.message });
    }
}
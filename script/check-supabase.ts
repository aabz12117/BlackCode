import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://hmdycuhxetnwcnbwhwua.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lhmomCyqpnkUDgvqjZYpaQ_1N9AZC9-';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAndCreateTables() {
    console.log('Checking Supabase connection...');

    try {
        // Check if users table exists
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (usersError?.code === 'PGRST205') {
            console.log('Users table not found. Creating tables...');

            // Need to create tables using SQL
            // Since we're using Supabase, we need to create tables through their dashboard or SQL API
            console.log('Please create the following tables in your Supabase dashboard:');
            console.log('1. users: id (UUID), code (text), name (text), points (integer), level (integer), role (text), status (text), created_at (timestamp)');
            console.log('2. missions: id (UUID), title (text), description (text), points (integer), type (text), difficulty (text), cooldown (integer), repeatable (boolean), active (boolean), hidden (boolean), answer (text), hint_url (text), target_users (json), created_at (timestamp)');
            console.log('3. plays: id (UUID), user_id (UUID), mission_id (UUID), score (integer), time_spent (integer), completed (boolean), timestamp (timestamp)');

            return;
        }

        console.log('Tables exist. Connection successful!');
        console.log('Number of users:', users?.length || 0);

    } catch (error) {
        console.error('Error:', error);
    }
}

checkAndCreateTables();

import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://lsmcwfutqempnrggwrky.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjAzNTRiODkzLTgzNTAtNGRiYy1hNDMxLWQ1ZjY3NTZlNjZkOCJ9.eyJwcm9qZWN0SWQiOiJsc21jd2Z1dHFlbXBucmdnd3JreSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc0NzMyMjQ4LCJleHAiOjIwOTAwOTIyNDgsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.WoHwN-eAMLROj6YJ4ymDNS_IsFP58HgmvsoPL_1wwBI';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };
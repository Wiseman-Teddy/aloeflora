const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.apnmunmhlrpcbmjmywyh:Annwiseman%40%402025@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase. Updating handle_new_user trigger...");
    
    await client.query(`
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, email, role, phone, address, hair_type, skin_type
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'hair_type',
    new.raw_user_meta_data->>'skin_type'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Successfully updated trigger and reloaded API cache!");

  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();

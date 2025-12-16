const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config();
const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_PRIVATE_KEY // backend only
);

module.exports = supabase;

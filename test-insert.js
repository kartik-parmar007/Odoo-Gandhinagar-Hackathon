import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import crypto from "crypto";

const envContent = fs.readFileSync(".env", "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const [key, ...valParts] = line.split("=");
  if (key && valParts.length > 0) {
    env[key.trim()] = valParts.join("=").trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log("Testing insert into 'vendors' with UUID...");
  const newId = crypto.randomUUID();
  const { data, error } = await supabase.from("vendors").insert({
    id: newId,
    company_name: "Test Vendor " + newId,
    category: "Furniture",
    gst_number: "22AAAAA0000A1Z5",
    contact_details: "+91 99999 99999",
    rating: 4.5,
    status: "Active"
  }).select();

  if (error) {
    console.error("Insert error details:", error);
  } else {
    console.log("Insert success:", data);
  }
}

testInsert();

'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

let browserClient: SupabaseClient | undefined;

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Missing Supabase environment variables');
  browserClient ??= createBrowserClient(config.supabaseUrl, config.supabaseAnonKey);
  return browserClient;
}

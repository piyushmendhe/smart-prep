import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  // Verify the calling user via their access token
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);

  // Validate the token and get the user
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin email
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use service role key to list all users
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    name:
      u.user_metadata?.full_name ??
      u.user_metadata?.name ??
      u.email?.split('@')[0] ??
      'Unknown',
    provider: (u.app_metadata?.provider as string) ?? 'email',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }));

  return NextResponse.json({ users });
}

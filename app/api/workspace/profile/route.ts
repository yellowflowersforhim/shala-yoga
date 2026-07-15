import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTenantFromRequest } from '@/lib/api-helpers';
import { getProfile, upsertProfile } from '@/lib/services/brand';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const tenant = await getTenantFromRequest(request.headers);
  if (!tenant) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  try {
    const profile = await getProfile(tenant);
    return NextResponse.json(profile || {});
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const tenant = await getTenantFromRequest(request.headers);
  if (!tenant) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  try {
    const body = await request.json();
    const profile = await upsertProfile(tenant, body);
    return NextResponse.json(profile);
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

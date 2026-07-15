import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTenantFromRequest } from '@/lib/api-helpers';
import { upsertSettings } from '@/lib/services/brand';

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const tenant = await getTenantFromRequest(request.headers);
  if (!tenant) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  try {
    const body = await request.json();
    await upsertSettings(tenant, body);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

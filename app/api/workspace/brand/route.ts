import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTenantFromRequest } from '@/lib/api-helpers';
import { getTheme, updateTheme, getSettings, upsertSettings } from '@/lib/services/brand';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const tenant = await getTenantFromRequest(request.headers);
  if (!tenant) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  try {
    const [theme, settings] = await Promise.all([getTheme(tenant), getSettings(tenant)]);
    return NextResponse.json({ theme, settings });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const tenant = await getTenantFromRequest(request.headers);
  if (!tenant) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  try {
    const body = await request.json();
    const theme = await updateTheme(tenant, body);
    return NextResponse.json(theme);
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

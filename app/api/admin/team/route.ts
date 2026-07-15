import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTenantFromRequest } from '@/lib/api-helpers';
import { getTeamMembers, inviteTeamMember, removeTeamMember } from '@/lib/services/workspace';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const tenant = await getTenantFromRequest(request.headers);
  if (!tenant) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  try {
    const members = await getTeamMembers(tenant);
    return NextResponse.json(members);
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const tenant = await getTenantFromRequest(request.headers);
  if (!tenant) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  try {
    const { email, role } = await request.json();
    await inviteTeamMember(tenant, email, role, (session.user as any).id);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message || 'Error' }, { status: 400 }); }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const tenant = await getTenantFromRequest(request.headers);
  if (!tenant) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    await removeTeamMember(tenant, userId);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message || 'Error' }, { status: 400 }); }
}

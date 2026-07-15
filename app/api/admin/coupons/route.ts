import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);
    const coupons = await prisma.coupon.findMany({
      where: withTenant({}, tenant),
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('Error al obtener cupones:', error);
    return NextResponse.json({ error: 'Error al cargar los cupones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenant = await getTenantFromRequest(request.headers);
    const body = await request.json();
    const { code, description, discountType, discountValue, maxUses, validFrom, validUntil, minPurchaseCents, isActive } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: 'Código, tipo de descuento y valor son requeridos' }, { status: 400 });
    }
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return NextResponse.json({ error: 'El porcentaje debe estar entre 0 y 100' }, { status: 400 });
    }
    if (discountType === 'fixed' && discountValue < 0) {
      return NextResponse.json({ error: 'El valor del descuento debe ser positivo' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description: description || null,
        discountType,
        discountValue,
        maxUses: maxUses || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        minPurchaseCents: minPurchaseCents || null,
        isActive: isActive !== undefined ? isActive : true,
        tenantId: tenant?.tenantId || '',
      },
    });

    return NextResponse.json({ message: 'Cupón creado exitosamente', coupon });
  } catch (error) {
    console.error('Error al crear cupón:', error);
    return NextResponse.json({ error: 'Error al crear el cupón' }, { status: 500 });
  }
}

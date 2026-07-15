
import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/coupons';
import { enforceRateLimit } from '@/lib/security';
import { getTenantFromRequest } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(request, 'coupon-validation', 30, 60 * 1000);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const tenant = await getTenantFromRequest(request.headers);
    const { code, purchaseAmountCents } = body;
    const amount = Number(purchaseAmountCents);
    const result = await validateCoupon(code, amount, tenant?.tenantId);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error, valid: false },
        { status: result.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al validar cupón:', error);
    return NextResponse.json(
      { error: 'Error al validar el cupón', valid: false },
      { status: 500 }
    );
  }
}

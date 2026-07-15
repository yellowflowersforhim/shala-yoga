import { prisma } from '@/lib/prisma';

export type CouponValidation =
  | {
      valid: false;
      error: string;
      status: number;
    }
  | {
      valid: true;
      coupon: {
        id: string;
        code: string;
        description: string | null;
        discountType: string;
        discountValue: number;
        discountCents: number;
        finalAmountCents: number;
      };
    };

export async function validateCoupon(code: unknown, purchaseAmountCents: number, tenantId?: string): Promise<CouponValidation> {
  if (typeof code !== 'string' || !code.trim()) {
    return { valid: false, error: 'Código de cupón requerido', status: 400 };
  }

  if (!Number.isSafeInteger(purchaseAmountCents) || purchaseAmountCents < 0) {
    return { valid: false, error: 'Importe de compra inválido', status: 400 };
  }

  const coupon = await prisma.coupon.findFirst({
    where: { code: code.trim().toUpperCase(), ...(tenantId ? { tenantId } : {}) },
  });

  if (!coupon) return { valid: false, error: 'Cupón no válido', status: 404 };
  if (!coupon.isActive) return { valid: false, error: 'Este cupón no está activo', status: 400 };

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) {
    return { valid: false, error: 'Este cupón aún no es válido', status: 400 };
  }
  if (coupon.validUntil && now > coupon.validUntil) {
    return { valid: false, error: 'Este cupón ha expirado', status: 400 };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'Este cupón ha alcanzado su límite de usos', status: 400 };
  }
  if (coupon.minPurchaseCents !== null && purchaseAmountCents < coupon.minPurchaseCents) {
    const minAmount = (coupon.minPurchaseCents / 100).toFixed(2);
    return { valid: false, error: `Compra mínima de €${minAmount} requerida para usar este cupón`, status: 400 };
  }

  let discountCents: number;
  if (coupon.discountType === 'percentage') {
    if (coupon.discountValue < 0 || coupon.discountValue > 100) {
      return { valid: false, error: 'Configuración de cupón inválida', status: 400 };
    }
    discountCents = Math.round((purchaseAmountCents * coupon.discountValue) / 100);
  } else if (coupon.discountType === 'fixed') {
    if (coupon.discountValue < 0) {
      return { valid: false, error: 'Configuración de cupón inválida', status: 400 };
    }
    discountCents = Math.min(coupon.discountValue, purchaseAmountCents);
  } else {
    return { valid: false, error: 'Configuración de cupón inválida', status: 400 };
  }

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountCents,
      finalAmountCents: purchaseAmountCents - discountCents,
    },
  };
}


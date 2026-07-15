import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/teachers
 *
 * Multi-tenant teachers listing with filters.
 * Returns active tenants with teacher profiles, their programs, and feedback stats.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim() || '';
    const style = searchParams.get('style')?.trim().toLowerCase() || '';
    const modality = searchParams.get('modality')?.trim().toLowerCase() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const skip = (page - 1) * limit;

    // ── Build where clause for tenants ──────────────────────────────
    const tenantWhere: any = {
      status: { not: 'archived' },
      teacherProfile: { isNot: null },
    };

    // Search filter: match against teacherProfile fields
    if (search) {
      tenantWhere.teacherProfile = {
        ...tenantWhere.teacherProfile,
        OR: [
          { displayName: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Style filter: match against teacherProfile title
    if (style) {
      tenantWhere.teacherProfile = {
        ...tenantWhere.teacherProfile,
        title: { contains: style, mode: 'insensitive' },
      };
    }

    // Modality filter: check weeklySessions
    if (modality === 'online' || modality === 'presencial') {
      tenantWhere.weeklySessions = {
        some: { sessionType: modality, isActive: true },
      };
    }

    // ── Count total ─────────────────────────────────────────────────
    const total = await prisma.tenant.count({ where: tenantWhere });
    const totalPages = Math.ceil(total / limit);

    // ── Fetch teachers ──────────────────────────────────────────────
    const tenants = await prisma.tenant.findMany({
      where: tenantWhere,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        teacherProfile: true,
        programs: {
          where: { isActive: true },
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
        weeklySessions: {
          where: { isActive: true },
          select: { sessionType: true },
        },
        feedback: {
          where: { isPublic: true },
          select: { rating: true, message: true, name: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            programs: true,
            feedback: true,
            memberships: true,
            enrollments: true,
          },
        },
      },
    });

    // ── Compute stats across all active teachers ────────────────────
    const statsTenants = await prisma.tenant.findMany({
      where: {
        status: { not: 'archived' },
        teacherProfile: { isNot: null },
      },
      include: {
        _count: {
          select: {
            programs: true,
            memberships: true,
            enrollments: true,
          },
        },
      },
    });

    const totalTeachers = statsTenants.length;
    const totalStudents = statsTenants.reduce((sum, t) => sum + t._count.enrollments, 0);
    const totalPrograms = statsTenants.reduce((sum, t) => sum + t._count.programs, 0);

    // ── Format response ────────────────────────────────────────────
    const teachers = tenants.map((tenant) => {
      const profile = tenant.teacherProfile!;
      const inferredStyle = profile.title ? extractStyleFromTitle(profile.title) : null;
      const ratings = tenant.feedback.map((f) => f.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const featuredTestimonial = tenant.feedback.length > 0 ? tenant.feedback[0] : null;
      const modalities = [...new Set(tenant.weeklySessions.map((ws) => ws.sessionType))];

      return {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        teacherProfile: {
          displayName: profile.displayName,
          title: profile.title,
          portraitUrl: profile.portraitUrl,
          location: profile.location,
          bio: profile.bio ? profile.bio.substring(0, 200) : null,
        },
        programs: tenant.programs.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          imageUrl: p.imageUrl,
        })),
        stats: {
          programsCount: tenant._count.programs,
          studentsCount: tenant._count.enrollments,
        },
        rating: {
          average: Math.round(avgRating * 10) / 10,
          count: ratings.length,
        },
        style: inferredStyle,
        modalities,
        featuredTestimonial: featuredTestimonial
          ? {
              name: featuredTestimonial.name,
              rating: featuredTestimonial.rating,
              message: featuredTestimonial.message.substring(0, 150),
            }
          : null,
      };
    });

    return NextResponse.json({
      teachers,
      total,
      page,
      limit,
      totalPages,
      stats: { totalTeachers, totalStudents, totalPrograms },
    });
  } catch (error) {
    console.error('[API /teachers] Error:', error);
    return NextResponse.json(
      { error: 'Error al cargar profesores' },
      { status: 500 }
    );
  }
}

function extractStyleFromTitle(title: string): string | null {
  const styles = [
    'hatha', 'vinyasa', 'ashtanga', 'kundalini', 'yin',
    'restorative', 'iyengar', 'power', 'bikram', 'acro',
    'aerial', 'jivamukti', 'anusara', 'sivananda',
  ];
  const lower = title.toLowerCase();
  for (const s of styles) {
    if (lower.includes(s)) return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return null;
}

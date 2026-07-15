import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import LandingClient from './landing-client';

// ── Types ──────────────────────────────────────────────────────────────────
interface TeacherData {
  id: string;
  slug: string;
  name: string;
  teacherProfile: {
    displayName: string;
    title: string | null;
    portraitUrl: string | null;
    location: string | null;
    bio: string | null;
  };
  programs: { id: string; title: string; imageUrl: string | null }[];
  stats: { programsCount: number; studentsCount: number };
  rating: { average: number; count: number };
  style: string | null;
  modalities: string[];
  featuredTestimonial: { name: string; rating: number; message: string } | null;
}

interface ApiResponse {
  teachers: TeacherData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: { totalTeachers: number; totalStudents: number; totalPrograms: number };
}

// ── Server data fetcher ────────────────────────────────────────────────────
async function fetchTeachers(
  search: string,
  style: string,
  modality: string,
  page: number
): Promise<ApiResponse> {
  const limit = 12;
  const skip = (page - 1) * limit;

  try {
    // Try internal API first (when running as a server)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (style) params.set('style', style);
    if (modality) params.set('modality', modality);

    const res = await fetch(`${baseUrl}/api/teachers?${params.toString()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return res.json();
  } catch {
    // Fallback to direct DB query when API isn't reachable (e.g., build time)
  }

  return fallbackData(search, style, modality, page, limit, skip);
}

/** Direct DB fallback when the API route is unavailable */
async function fallbackData(
  search: string,
  style: string,
  modality: string,
  page: number,
  limit: number,
  skip: number
): Promise<ApiResponse> {
  const tenantWhere: any = {
    status: { not: 'archived' },
    teacherProfile: { isNot: null },
  };

  if (search) {
    tenantWhere.teacherProfile = {
      OR: [
        { displayName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  if (style) {
    tenantWhere.teacherProfile = {
      ...(tenantWhere.teacherProfile || {}),
      title: { contains: style, mode: 'insensitive' },
    };
  }

  if (modality === 'online' || modality === 'presencial') {
    tenantWhere.weeklySessions = {
      some: { sessionType: modality, isActive: true },
    };
  }

  try {
    const [total, tenants, allTeachers] = await Promise.all([
      prisma.tenant.count({ where: tenantWhere }),
      prisma.tenant.findMany({
        where: tenantWhere,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          teacherProfile: true,
          programs: { where: { isActive: true }, take: 3 },
          weeklySessions: { where: { isActive: true }, select: { sessionType: true } },
          feedback: {
            where: { isPublic: true },
            select: { rating: true, message: true, name: true },
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { programs: true, feedback: true, enrollments: true } },
        },
      }),
      prisma.tenant.findMany({
        where: { status: { not: 'archived' }, teacherProfile: { isNot: null } },
        include: { _count: { select: { programs: true, enrollments: true } } },
      }),
    ]);

    const teachers: TeacherData[] = tenants.map((t) => {
      const p = t.teacherProfile!;
      const ratings = t.feedback.map((f) => f.rating);
      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        id: t.id,
        slug: t.slug,
        name: t.name,
        teacherProfile: {
          displayName: p.displayName,
          title: p.title,
          portraitUrl: p.portraitUrl,
          location: p.location,
          bio: p.bio?.substring(0, 200) ?? null,
        },
        programs: t.programs.map((pr) => ({
          id: pr.id,
          title: pr.title,
          imageUrl: pr.imageUrl,
        })),
        stats: { programsCount: t._count.programs, studentsCount: t._count.enrollments },
        rating: { average: Math.round(avgRating * 10) / 10, count: ratings.length },
        style: extractStyle(p.title),
        modalities: [...new Set(t.weeklySessions.map((ws) => ws.sessionType))],
        featuredTestimonial: t.feedback[0]
          ? {
              name: t.feedback[0].name,
              rating: t.feedback[0].rating,
              message: t.feedback[0].message.substring(0, 150),
            }
          : null,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      teachers,
      total,
      page,
      limit,
      totalPages,
      stats: {
        totalTeachers: allTeachers.length,
        totalStudents: allTeachers.reduce((s, t) => s + t._count.enrollments, 0),
        totalPrograms: allTeachers.reduce((s, t) => s + t._count.programs, 0),
      },
    };
  } catch {
    return {
      teachers: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 0,
      stats: { totalTeachers: 0, totalStudents: 0, totalPrograms: 0 },
    };
  }
}

function extractStyle(title: string | null): string | null {
  if (!title) return null;
  const styles = ['hatha', 'vinyasa', 'ashtanga', 'kundalini', 'yin', 'restorative', 'iyengar', 'power'];
  const lower = title.toLowerCase();
  for (const s of styles) {
    if (lower.includes(s)) return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return null;
}

// ── Server component ───────────────────────────────────────────────────────
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; style?: string; modality?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || '';
  const style = params.style || '';
  const modality = params.modality || '';
  const page = Math.max(1, parseInt(params.page || '1', 10));

  const data = await fetchTeachers(search, style, modality, page);

  return (
    <Suspense fallback={<HomeLoading />}>
      <LandingClient initialData={data} />
    </Suspense>
  );
}

function HomeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--brand-primary))]" />
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Star,
  Users,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Quote,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  stats: {
    totalTeachers: number;
    totalStudents: number;
    totalPrograms: number;
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

const YOGA_STYLES = [
  { value: '', label: 'Todos los estilos' },
  { value: 'hatha', label: 'Hatha' },
  { value: 'vinyasa', label: 'Vinyasa' },
  { value: 'ashtanga', label: 'Ashtanga' },
  { value: 'kundalini', label: 'Kundalini' },
  { value: 'yin', label: 'Yin' },
  { value: 'restorative', label: 'Restorative' },
  { value: 'iyengar', label: 'Iyengar' },
];

const MODALITIES = [
  { value: '', label: 'Todas las modalidades' },
  { value: 'online', label: 'Online' },
  { value: 'presencial', label: 'Presencial' },
];

const POPULAR_STYLES = ['Hatha', 'Vinyasa', 'Ashtanga', 'Kundalini'];

// ── Helpers ────────────────────────────────────────────────────────────────

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) {
          return <Star key={i} size={size} className="fill-amber-400 text-amber-400" />;
        }
        if (i === full && hasHalf) {
          return (
            <span key={i} className="relative">
              <Star size={size} className="text-amber-200" />
              <Star
                size={size}
                className="fill-amber-400 text-amber-400 absolute inset-0"
                style={{ clipPath: 'inset(0 50% 0 0)' }}
              />
            </span>
          );
        }
        return <Star key={i} size={size} className="text-amber-200" />;
      })}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getGradientFromName(name: string): string {
  const gradients = [
    'from-emerald-400 to-teal-500',
    'from-purple-400 to-violet-500',
    'from-amber-400 to-orange-500',
    'from-sky-400 to-blue-500',
    'from-rose-400 to-pink-500',
    'from-lime-400 to-green-500',
    'from-indigo-400 to-purple-500',
    'from-teal-400 to-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function LandingClient({ initialData }: { initialData: ApiResponse }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [style, setStyle] = useState(searchParams.get('style') || '');
  const [modality, setModality] = useState(searchParams.get('modality') || '');

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams();
      const s = overrides.search ?? search;
      const st = overrides.style ?? style;
      const m = overrides.modality ?? modality;
      if (s) params.set('search', s);
      if (st) params.set('style', st);
      if (m) params.set('modality', m);
      params.set('page', overrides.page || '1');
      return `/?${params.toString()}`;
    },
    [search, style, modality]
  );

  const handleSearch = () => {
    router.push(buildUrl({ page: '1' }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleStyleChange = (value: string) => {
    setStyle(value);
    router.push(buildUrl({ style: value, page: '1' }));
  };

  const handleModalityChange = (value: string) => {
    setModality(value);
    router.push(buildUrl({ modality: value, page: '1' }));
  };

  const handleClearFilters = () => {
    setSearch('');
    setStyle('');
    setModality('');
    router.push('/');
  };

  const handlePageChange = (newPage: number) => {
    router.push(buildUrl({ page: String(newPage) }));
  };

  const hasActiveFilters = search || style || modality;

  const { teachers, total, page, totalPages, stats } = initialData;

  // Testimonials from teacher data
  const testimonials = teachers
    .filter((t) => t.featuredTestimonial)
    .slice(0, 6)
    .map((t) => ({
      name: t.featuredTestimonial!.name,
      rating: t.featuredTestimonial!.rating,
      message: t.featuredTestimonial!.message,
      teacherName: t.teacherProfile.displayName,
    }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdfa] via-white to-[#faf5ff]">
      {/* ═══════════════════════════════════════════════════════════════
           HERO
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-100/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-amber-100/20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-32 md:pb-24">
          <div className="text-center max-w-3xl mx-auto">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-6">
              <Sparkles size={14} />
              Plataforma multi-tenant de yoga
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Encuentra tu{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-violet-500 bg-clip-text text-transparent">
                profesor de yoga
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Conecta con instructores certificados, descubre programas únicos y
              transforma tu práctica cerca de ti.
            </p>

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  type="text"
                  placeholder="Busca por ciudad o estilo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 h-12 text-base rounded-xl border-gray-200 bg-white/80 backdrop-blur-sm"
                />
              </div>
              <Button
                onClick={handleSearch}
                size="lg"
                className="h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200"
              >
                Buscar
              </Button>
            </div>

            {/* Popular style pills */}
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-sm text-gray-500 mr-1 mt-1">Estilos populares:</span>
              {POPULAR_STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStyle(s.toLowerCase());
                    router.push(buildUrl({ style: s.toLowerCase(), page: '1' }));
                  }}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/70 border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           STATISTICS
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative -mt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            {[
              { icon: Users, label: 'Profesores', value: stats.totalTeachers, suffix: '' },
              { icon: GraduationCap, label: 'Alumnos', value: stats.totalStudents, suffix: '+' },
              { icon: BookOpen, label: 'Programas', value: stats.totalPrograms, suffix: '' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 mb-3">
                  <stat.icon size={22} />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {stat.value > 0 ? '+' : ''}{stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           FILTERS + TEACHERS GRID
         ═══════════════════════════════════════════════════════════════ */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Profesores destacados
              </h2>
              <p className="text-gray-500 mt-1">
                {total > 0
                  ? `${total} profesor${total !== 1 ? 'es' : ''} encontrado${total !== 1 ? 's' : ''}`
                  : 'Explora nuestra comunidad de instructores'}
              </p>
            </div>
          </div>

          {/* Filters bar */}
          <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-full sm:w-auto sm:min-w-[200px]">
              <Select value={style} onValueChange={handleStyleChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Estilo" />
                </SelectTrigger>
                <SelectContent>
                  {YOGA_STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[200px]">
              <Select value={modality} onValueChange={handleModalityChange}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Modalidad" />
                </SelectTrigger>
                <SelectContent>
                  {MODALITIES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                Limpiar filtros
              </Button>
            )}

            <div className="flex-1 sm:max-w-xs ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  className="pl-9 h-10 text-sm rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Teachers grid */}
          {teachers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {teachers.map((teacher) => (
                  <TeacherCard key={teacher.id} teacher={teacher} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Anterior
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => (
                      <span key={p} className="flex items-center">
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="px-1 text-gray-400">...</span>
                        )}
                        <Button
                          variant={p === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(p)}
                          className={
                            p === page
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : ''
                          }
                        >
                          {p}
                        </Button>
                      </span>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-amber-500 mb-4">
                <Search size={28} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No encontramos profesores
              </h3>
              <p className="text-gray-500 mb-6">
                Intenta con otros filtros o términos de búsqueda
              </p>
              <Button variant="outline" onClick={handleClearFilters}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           CTA — ÚNETE COMO PROFESOR
         ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-r from-emerald-50 via-teal-50 to-violet-50 border-y border-emerald-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white mb-6 shadow-lg shadow-emerald-200">
            <Sparkles size={28} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            ¿Eres profesor de yoga?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            Únete a nuestra plataforma y llega a más alumnos. Gestiona tus programas,
            reservas y comunidad desde un solo lugar.
          </p>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="h-14 px-10 text-lg rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200"
            >
              Regístrate como profesor
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
          <p className="text-sm text-gray-400 mt-4">
            Gratis para empezar · Sin compromisos
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
           TESTIMONIALS
         ═══════════════════════════════════════════════════════════════ */}
      {testimonials.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Lo que dicen nuestros alumnos
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Historias reales de transformación a través del yoga
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <Card
                  key={i}
                  className="border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-amber-400">
                      <Quote size={16} className="text-emerald-400" />
                      <StarRating rating={t.rating} size={14} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                      &ldquo;{t.message}&rdquo;
                    </p>
                  </CardContent>
                  <CardFooter className="border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                          {getInitials(t.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400">Alumno de {t.teacherName}</p>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Teacher Card ───────────────────────────────────────────────────────────

function TeacherCard({ teacher }: { teacher: TeacherData }) {
  const { teacherProfile: p } = teacher;

  return (
    <Link href={`/t/${teacher.slug}`} className="group block">
      <Card className="h-full border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 overflow-hidden">
        {/* Photo area */}
        <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
          {p.portraitUrl ? (
            <img
              src={p.portraitUrl}
              alt={p.displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getGradientFromName(
                p.displayName
              )}`}
            >
              <span className="text-5xl font-bold text-white/90">
                {getInitials(p.displayName)}
              </span>
            </div>
          )}

          {/* Style badge */}
          {teacher.style && (
            <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-emerald-700 border-emerald-200 hover:bg-white/90">
              {teacher.style}
            </Badge>
          )}

          {/* Modality badges */}
          {teacher.modalities.length > 0 && (
            <div className="absolute top-3 right-3 flex gap-1">
              {teacher.modalities.includes('online') && (
                <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-xs">
                  Online
                </Badge>
              )}
              {teacher.modalities.includes('presencial') && (
                <Badge variant="outline" className="bg-white/90 backdrop-blur-sm text-xs">
                  Presencial
                </Badge>
              )}
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 text-base group-hover:text-emerald-700 transition-colors">
            {p.displayName}
          </h3>
          {p.title && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{p.title}</p>
          )}

          {/* Rating */}
          {teacher.rating.count > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={teacher.rating.average} size={14} />
              <span className="text-xs text-gray-400">
                {teacher.rating.average.toFixed(1)} ({teacher.rating.count})
              </span>
            </div>
          )}

          {/* Location */}
          {p.location && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-400">
              <MapPin size={14} />
              <span>{p.location}</span>
            </div>
          )}

          {/* Program count */}
          {teacher.stats.programsCount > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
              <BookOpen size={12} />
              <span>
                {teacher.stats.programsCount} programa
                {teacher.stats.programsCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 group-hover:border-emerald-300 transition-colors"
          >
            Ver perfil
            <ArrowRight size={14} className="ml-1" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}


import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest, withTenant } from '@/lib/api-helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar as CalendarIcon, History, Sparkles } from 'lucide-react';
import { EnrollmentCard } from '@/components/student/enrollment-card';
import { CalendarView } from '@/components/student/calendar-view';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const tenant = await getTenantFromRequest(await headers());

  const enrollments = await prisma.enrollment.findMany({
    where: withTenant({ userId: (session.user as any).id }, tenant),
    include: {
      cohort: {
        include: {
          program: true
        }
      },
      order: true
    },
    orderBy: { enrolledAt: 'desc' }
  });

  const today = new Date();

  // Separate enrollments by status
  const activeEnrollments = enrollments.filter((e: any) => {
    const endDate = new Date(e.cohort?.endDate);
    return endDate >= today && e.status === 'active';
  });

  const completedEnrollments = enrollments.filter((e: any) => {
    const endDate = new Date(e.cohort?.endDate);
    return endDate < today || e.status === 'completed';
  });

  const upcomingEnrollments = enrollments.filter((e: any) => {
    const startDate = new Date(e.cohort?.startDate);
    return startDate > today && e.status === 'active';
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[hsl(var(--brand-primary-light))]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Bienvenido, {session.user.name} 🙏
              </h1>
              <p className="text-[hsl(var(--brand-primary-light))] text-lg">
                Tu espacio personal de aprendizaje
              </p>
            </div>
            <Link href="/programas">
              <Button variant="secondary" size="lg" className="hidden md:flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Explorar Programas
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[hsl(var(--brand-primary-light))] text-sm">Programas Activos</p>
                    <p className="text-3xl font-bold mt-1">{activeEnrollments.length}</p>
                  </div>
                  <BookOpen className="h-10 w-10 text-[hsl(var(--brand-primary-light))]" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[hsl(var(--brand-primary-light))] text-sm">Próximos</p>
                    <p className="text-3xl font-bold mt-1">{upcomingEnrollments.length}</p>
                  </div>
                  <CalendarIcon className="h-10 w-10 text-[hsl(var(--brand-primary-light))]" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[hsl(var(--brand-primary-light))] text-sm">Completados</p>
                    <p className="text-3xl font-bold mt-1">{completedEnrollments.length}</p>
                  </div>
                  <History className="h-10 w-10 text-[hsl(var(--brand-primary-light))]" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {enrollments.length > 0 ? (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Activos</span>
                <span className="sm:hidden">Activos</span>
                {activeEnrollments.length > 0 && (
                  <span className="ml-1 bg-[hsl(var(--brand-primary-light))] text-[hsl(var(--brand-primary-dark))] px-2 py-0.5 rounded-full text-xs font-semibold">
                    {activeEnrollments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Calendario</span>
                <span className="sm:hidden">Cal.</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Historial</span>
                <span className="sm:hidden">Hist.</span>
                {completedEnrollments.length > 0 && (
                  <span className="ml-1 bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {completedEnrollments.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Active Enrollments Tab */}
            <TabsContent value="active" className="space-y-6">
              {activeEnrollments.length > 0 || upcomingEnrollments.length > 0 ? (
                <>
                  {upcomingEnrollments.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                        Próximos a Comenzar
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {upcomingEnrollments.map((enrollment: any) => (
                          <EnrollmentCard key={enrollment.id} enrollment={enrollment} showProgress={false} />
                        ))}
                      </div>
                    </div>
                  )}

                  {activeEnrollments.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
                        En Curso
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {activeEnrollments.map((enrollment: any) => (
                          <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No tienes programas activos
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Explora nuestros programas y comienza tu viaje de transformación
                    </p>
                    <Link href="/programas">
                      <Button size="lg" className="bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))]">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Ver Programas Disponibles
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              <CalendarView enrollments={enrollments} />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              {completedEnrollments.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <History className="h-5 w-5 text-green-600" />
                      Programas Completados
                    </h3>
                    <p className="text-sm text-gray-600">
                      Total: {completedEnrollments.length} {completedEnrollments.length === 1 ? 'programa' : 'programas'}
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {completedEnrollments.map((enrollment: any) => (
                      <EnrollmentCard key={enrollment.id} enrollment={enrollment} showProgress={false} />
                    ))}
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Aún no has completado ningún programa
                    </h3>
                    <p className="text-gray-500">
                      Tu historial aparecerá aquí cuando completes tus programas
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="max-w-md mx-auto">
                <BookOpen className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Comienza tu viaje de yoga
                </h2>
                <p className="text-gray-600 mb-8">
                  Aún no estás inscrito en ningún programa. Explora nuestra selección de programas de Hatha Yoga Clásico y encuentra el que mejor se adapte a ti.
                </p>
                <Link href="/programas">
                  <Button size="lg" className="bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))]">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Explorar Programas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

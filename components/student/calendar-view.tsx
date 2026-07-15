
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { useMemo } from 'react';

interface CalendarViewProps {
  enrollments: any[];
}

interface CalendarEvent {
  id: string;
  title: string;
  cohortName: string;
  date: Date;
  time: string;
  location: string;
  type: 'start' | 'end' | 'ongoing';
  status: string;
}

export function CalendarView({ enrollments }: CalendarViewProps) {
  const events: CalendarEvent[] = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    
    enrollments.forEach((enrollment) => {
      const cohort = enrollment.cohort;
      const program = cohort?.program;
      
      if (!cohort || !program) return;
      
      // Add start date event
      allEvents.push({
        id: `${enrollment.id}-start`,
        title: program.title,
        cohortName: cohort.name,
        date: new Date(cohort.startDate),
        time: cohort.scheduleText,
        location: cohort.location,
        type: 'start',
        status: enrollment.status
      });
      
      // Add end date event
      allEvents.push({
        id: `${enrollment.id}-end`,
        title: program.title,
        cohortName: cohort.name,
        date: new Date(cohort.endDate),
        time: cohort.scheduleText,
        location: cohort.location,
        type: 'end',
        status: enrollment.status
      });
    });
    
    // Sort by date
    return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [enrollments]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = events.filter(event => event.date >= today);
  const pastEvents = events.filter(event => event.date < today);

  const getEventIcon = (type: string) => {
    if (type === 'start') return '🚀';
    if (type === 'end') return '🎉';
    return '📅';
  };

  const getEventLabel = (type: string) => {
    if (type === 'start') return 'Inicio';
    if (type === 'end') return 'Finalización';
    return 'Evento';
  };

  return (
    <div className="space-y-6">
      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-[hsl(var(--brand-primary-light))] hover:bg-[hsl(var(--brand-primary-light))] transition-all duration-200"
                >
                  <div className="text-2xl">{getEventIcon(event.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">{event.cohortName}</p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {getEventLabel(event.type)}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-700">
                        <CalendarIcon className="h-3.5 w-3.5 mr-2 text-[hsl(var(--brand-primary))]" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <Clock className="h-3.5 w-3.5 mr-2 text-[hsl(var(--brand-primary))]" />
                        {event.time}
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <MapPin className="h-3.5 w-3.5 mr-2 text-[hsl(var(--brand-primary))]" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No tienes eventos próximos programados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              Eventos Pasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastEvents.slice(-5).reverse().map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div className="text-xl opacity-60">{getEventIcon(event.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-gray-700">{event.title}</h4>
                        <p className="text-xs text-gray-500">{event.cohortName}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getEventLabel(event.type)}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {formatDate(event.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

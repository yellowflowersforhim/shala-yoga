
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Calendar,
  DollarSign,
  BookOpen,
  MessageSquare,
  Trash2,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentDetails {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  enrollments: Array<{
    id: string;
    status: string;
    enrolledAt: string;
    cohort: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      program: {
        title: string;
      };
    };
    order: {
      orderNumber: string;
      totalCents: number;
    };
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalCents: number;
    paidAt: string | null;
    cohort: {
      name: string;
      program: {
        title: string;
      };
    };
  }>;
  notes: Array<{
    id: string;
    category: string;
    content: string;
    createdAt: string;
    admin: {
      name: string;
      email: string;
    };
  }>;
  stats: {
    activeEnrollments: number;
    completedEnrollments: number;
    totalEnrollments: number;
    totalSpent: number;
  };
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteCategory, setNoteCategory] = useState('general');
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchStudent = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/students/${params.id}`);
      if (!res.ok) throw new Error('Error al obtener estudiante');
      const data = await res.json();
      setStudent(data);
    } catch (error) {
      console.error('Error fetching student:', error);
      toast.error('Error al cargar el estudiante');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void fetchStudent();
  }, [fetchStudent]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      toast.error('El contenido de la nota es requerido');
      return;
    }

    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/admin/students/${params.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: noteCategory, content: noteContent }),
      });

      if (!res.ok) throw new Error('Error al crear nota');

      toast.success('Nota agregada correctamente');
      setNoteContent('');
      setNoteCategory('general');
      setShowNoteForm(false);
      fetchStudent();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Error al agregar la nota');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta nota?')) return;

    try {
      const res = await fetch(
        `/api/admin/students/${params.id}/notes/${noteId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) throw new Error('Error al eliminar nota');

      toast.success('Nota eliminada correctamente');
      fetchStudent();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error al eliminar la nota');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Estudiante no encontrado</p>
        <Link
          href="/admin/estudiantes"
          className="text-[hsl(var(--brand-primary))] hover:text-[hsl(var(--brand-primary-dark))] mt-4 inline-block"
        >
          Volver a la lista
        </Link>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    general: 'General',
    health: 'Salud',
    progress: 'Progreso',
    attendance: 'Asistencia',
  };

  const categoryColors: Record<string, string> = {
    general: 'bg-gray-100 text-gray-700',
    health: 'bg-red-100 text-red-700',
    progress: 'bg-green-100 text-green-700',
    attendance: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {student.email}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inscripciones Activas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {student.stats.activeEnrollments}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {student.stats.completedEnrollments}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Gastado</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                €{student.stats.totalSpent.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-[hsl(var(--brand-primary))]" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Miembro desde</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {new Date(student.createdAt).toLocaleDateString('es-ES')}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Inscripciones
          </h2>
          {student.enrollments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No tiene inscripciones
            </p>
          ) : (
            <div className="space-y-3">
              {student.enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {enrollment.cohort.program.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {enrollment.cohort.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(enrollment.cohort.startDate).toLocaleDateString('es-ES')} -{' '}
                        {new Date(enrollment.cohort.endDate).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        enrollment.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : enrollment.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {enrollment.status === 'active'
                        ? 'Activo'
                        : enrollment.status === 'completed'
                        ? 'Completado'
                        : 'Cancelado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Historial de Pagos
          </h2>
          {student.orders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tiene pedidos</p>
          ) : (
            <div className="space-y-3">
              {student.orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.cohort.program.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Pedido #{order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.paidAt
                          ? new Date(order.paidAt).toLocaleDateString('es-ES')
                          : 'Pendiente'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        €{(order.totalCents / 100).toFixed(2)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Notes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notas Privadas del Administrador
          </h2>
          <button
            onClick={() => setShowNoteForm(!showNoteForm)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--brand-primary))] text-white rounded-lg hover:bg-[hsl(var(--brand-primary-dark))] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Nota
          </button>
        </div>

        {/* Note Form */}
        {showNoteForm && (
          <form onSubmit={handleAddNote} className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--brand-primary))] focus:border-transparent"
              >
                <option value="general">General</option>
                <option value="health">Salud</option>
                <option value="progress">Progreso</option>
                <option value="attendance">Asistencia</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenido
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                placeholder="Escribe tu nota aquí..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[hsl(var(--brand-primary))] focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submittingNote}
                className="px-4 py-2 bg-[hsl(var(--brand-primary))] text-white rounded-lg hover:bg-[hsl(var(--brand-primary-dark))] transition-colors disabled:opacity-50"
              >
                {submittingNote ? 'Guardando...' : 'Guardar Nota'}
              </button>
              <button
                type="button"
                onClick={() => setShowNoteForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Notes List */}
        {student.notes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No hay notas sobre este estudiante
          </p>
        ) : (
          <div className="space-y-3">
            {student.notes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      categoryColors[note.category]
                    }`}
                  >
                    {categoryLabels[note.category]}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Eliminar nota"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Por {note.admin.name}</span>
                  <span>
                    {new Date(note.createdAt).toLocaleString('es-ES')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

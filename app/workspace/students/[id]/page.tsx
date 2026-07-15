"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Calendar,
  BookOpen,
  DollarSign,
  MessageSquare,
  Loader2,
  User,
} from "lucide-react";

type Enrollment = {
  id: string;
  status: string;
  enrolledAt: string;
  cohort: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    program: { id: string; title: string };
  };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  paidAt: string | null;
  createdAt: string;
  cohort: { id: string; name: string } | null;
};

type StudentDetail = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
  enrollments: Enrollment[];
  orders: Order[];
};

type Note = {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  admin: { id: string; name: string | null; email: string | null };
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
  failed: "Fallido",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  refunded: "bg-red-100 text-red-800",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  refunded: "Reembolsado",
  failed: "Fallido",
};

const NOTE_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "progress", label: "Progreso" },
  { value: "payment", label: "Pago" },
  { value: "attendance", label: "Asistencia" },
  { value: "behavior", label: "Comportamiento" },
  { value: "other", label: "Otro" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Note form
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [noteError, setNoteError] = useState("");

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/workspace/students/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError(true);
        }
        return;
      }
      setStudent(await res.json());
    } catch (err) {
      console.error("Error fetching student:", err);
      setError(true);
    }
    setLoading(false);
  }, [id]);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspace/students/${id}/notes`);
      if (res.ok) {
        setNotes(await res.json());
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
    fetchNotes();
  }, [fetchStudent, fetchNotes]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setNoteError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/workspace/students/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: noteContent.trim(),
          category: noteCategory,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setNoteError(d.error || "Error al crear nota");
        return;
      }
      const newNote = await res.json();
      setNotes((prev) => [newNote, ...prev]);
      setNoteContent("");
      setNoteCategory("general");
    } catch {
      setNoteError("Error al crear la nota");
    }
    setSubmitting(false);
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Cargando perfil del estudiante...
      </div>
    );
  }

  // ── Error / not found ──
  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <User className="h-10 w-10 mb-3" />
        <p className="mb-4">Estudiante no encontrado</p>
        <Link
          href="/workspace/students"
          className="flex items-center gap-2 text-sm text-[hsl(var(--brand-primary))] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a alumnos
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/workspace/students"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a alumnos
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="h-14 w-14 rounded-full bg-[hsl(var(--brand-primary-light))] flex items-center justify-center text-[hsl(var(--brand-primary))] font-bold text-xl">
          {(student.name || student.email || "?")[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{student.name || "Sin nombre"}</h1>
          <p className="text-gray-500">{student.email || "Sin email"}</p>
        </div>
      </div>

      {/* Personal info card */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
          Información personal
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Nombre</p>
            <p className="font-medium">{student.name || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Email</p>
            <p className="font-medium">{student.email || "—"}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Miembro desde</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(student.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Programs enrolled card */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
          Programas inscritos
        </h2>
        {student.enrollments.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">
            No está inscrito en ningún programa.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-3 py-2 font-medium">Cohorte</th>
                  <th className="px-3 py-2 font-medium">Programa</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {student.enrollments.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="px-3 py-2.5">{e.cohort.name}</td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {e.cohort.program.title}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                          STATUS_BADGE_STYLES[e.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[e.status] || e.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500">
                      {formatDate(e.enrolledAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order history card */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
          Historial de órdenes
        </h2>
        {student.orders.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">
            No hay órdenes registradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-3 py-2 font-medium">Nº Orden</th>
                  <th className="px-3 py-2 font-medium">Cohorte</th>
                  <th className="px-3 py-2 font-medium">Importe</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {student.orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {o.orderNumber}
                    </td>
                    <td className="px-3 py-2.5">
                      {o.cohort?.name || "—"}
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {formatCurrency(o.totalCents)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                          STATUS_BADGE_STYLES[o.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500">
                      {formatDate(o.paidAt || o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin notes card */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
          Notas del admin
        </h2>

        {/* Add note form */}
        <form onSubmit={handleAddNote} className="mb-6 pb-6 border-b">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nueva nota
            </label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] resize-y"
              placeholder="Escribe una nota sobre este estudiante..."
              required
            />
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Categoría
              </label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
              >
                {NOTE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting || !noteContent.trim()}
              className="px-4 py-2 bg-[hsl(var(--brand-primary))] text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Añadir nota"
              )}
            </button>
          </div>
          {noteError && (
            <p className="text-red-600 text-sm mt-2">{noteError}</p>
          )}
        </form>

        {/* Existing notes */}
        {notes.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">
            No hay notas registradas.
          </p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {note.admin.name || note.admin.email || "Admin"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                      {note.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(note.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

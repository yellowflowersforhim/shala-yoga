"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
} from "lucide-react";

type Enrollment = {
  id: string;
  status: string;
  enrolledAt: string;
  cohort: {
    id: string;
    name: string;
    program: { id: string; title: string };
  };
};

type Student = {
  id: string;
  name: string | null;
  email: string | null;
  enrollments: Enrollment[];
  totalOrders: number;
  totalSpentCents: number;
};

type Program = { id: string; title: string };
type Cohort = {
  id: string;
  name: string;
  programId: string;
};

type FilterData = {
  programs: Program[];
  cohorts: Cohort[];
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [programId, setProgramId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [filterData, setFilterData] = useState<FilterData>({
    programs: [],
    cohorts: [],
  });

  const pageSize = 20;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (search) params.set("search", search);
      if (programId) params.set("programId", programId);
      if (cohortId) params.set("cohortId", cohortId);

      const res = await fetch(`/api/workspace/students?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    }
    setLoading(false);
  }, [page, search, programId, cohortId]);

  const fetchFilters = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/students/filters");
      if (res.ok) {
        setFilterData(await res.json());
      }
    } catch (err) {
      console.error("Error fetching filters:", err);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function handleCohortFilter(value: string) {
    setCohortId(value);
    setPage(1);
    // If selecting a cohort, auto-select its program
    if (value) {
      const cohort = filterData.cohorts.find((c) => c.id === value);
      if (cohort) setProgramId(cohort.programId);
    }
    // If clearing cohort while program is set from cohort, let it be reset below
    if (!value && programId) {
      // Only clear program if it was auto-set by a cohort
      const anyCohortForProgram = filterData.cohorts.some(
        (c) => c.programId === programId,
      );
      // Don't auto-clear — just leave program filter as-is
    }
  }

  function handleProgramFilter(value: string) {
    setProgramId(value);
    setPage(1);
    // If clearing program, also clear cohort
    if (!value) setCohortId("");
  }

  const filteredCohorts = programId
    ? filterData.cohorts.filter((c) => c.programId === programId)
    : filterData.cohorts;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Alumnos</h1>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Nombre o email..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
              />
            </div>
          </div>

          {/* Program filter */}
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Programa
            </label>
            <select
              value={programId}
              onChange={(e) => handleProgramFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
            >
              <option value="">Todos los programas</option>
              {filterData.programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Cohort filter */}
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Cohorte
            </label>
            <select
              value={cohortId}
              onChange={(e) => handleCohortFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))] bg-white"
            >
              <option value="">Todas las cohortes</option>
              {filteredCohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Cargando estudiantes...
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <GraduationCap className="h-10 w-10 mb-3" />
            <p>No se encontraron estudiantes</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Programas</th>
                    <th className="px-4 py-3 font-medium">Progreso</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Gasto total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    // Deduplicate program titles
                    const programNames = [
                      ...new Set(
                        student.enrollments.map(
                          (e) => e.cohort.program.title,
                        ),
                      ),
                    ];
                    return (
                      <tr
                        key={student.id}
                        onClick={() =>
                          router.push(`/workspace/students/${student.id}`)
                        }
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {student.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {student.email || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {programNames.slice(0, 3).map((p) => (
                              <span
                                key={p}
                                className="inline-block px-2 py-0.5 text-xs bg-[hsl(var(--brand-primary-light))] text-[hsl(var(--brand-primary))] rounded-full"
                              >
                                {p}
                              </span>
                            ))}
                            {programNames.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{programNames.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {student.enrollments
                              .filter((e) => e.status !== "cancelled")
                              .slice(0, 2)
                              .map((e) => (
                                <span
                                  key={e.id}
                                  className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                                    STATUS_STYLES[e.status] ||
                                    "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {e.cohort.name}
                                </span>
                              ))}
                            {student.enrollments.filter(
                              (e) => e.status !== "cancelled",
                            ).length > 2 && (
                              <span className="text-xs text-gray-400">
                                +
                                {student.enrollments.filter(
                                  (e) => e.status !== "cancelled",
                                ).length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          €{(student.totalSpentCents / 100).toFixed(0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <p className="text-sm text-gray-500">
                  {total} estudiante{total !== 1 ? "s" : ""} — Página {page}{" "}
                  de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getTenantFromRequest } from "@/lib/api-helpers";
import { getStudentDetail } from "@/lib/services/students";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tenant = await getTenantFromRequest(request.headers);
  if (!tenant)
    return NextResponse.json({ error: "No tenant" }, { status: 400 });

  try {
    const { id } = await params;
    const student = await getStudentDetail(tenant, id);

    if (!student) {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(student);
  } catch (err) {
    console.error("[students/id] GET error:", err);
    return NextResponse.json(
      { error: "Error al cargar estudiante" },
      { status: 500 },
    );
  }
}

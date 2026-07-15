import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getTenantFromRequest } from "@/lib/api-helpers";
import { getStudents } from "@/lib/services/students";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tenant = await getTenantFromRequest(request.headers);
  if (!tenant)
    return NextResponse.json({ error: "No tenant" }, { status: 400 });

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || undefined;
    const programId = searchParams.get("programId") || undefined;
    const cohortId = searchParams.get("cohortId") || undefined;
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page")!)
      : undefined;
    const pageSize = searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : undefined;

    const result = await getStudents(tenant, {
      search,
      programId,
      cohortId,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[students] GET error:", err);
    return NextResponse.json(
      { error: "Error al cargar estudiantes" },
      { status: 500 },
    );
  }
}

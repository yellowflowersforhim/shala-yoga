import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getTenantFromRequest } from "@/lib/api-helpers";
import { getProgramsAndCohorts } from "@/lib/services/students";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tenant = await getTenantFromRequest(request.headers);
  if (!tenant)
    return NextResponse.json({ error: "No tenant" }, { status: 400 });

  try {
    const data = await getProgramsAndCohorts(tenant);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[students/filters] GET error:", err);
    return NextResponse.json(
      { error: "Error al cargar filtros" },
      { status: 500 },
    );
  }
}

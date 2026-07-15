import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getTenantFromRequest } from "@/lib/api-helpers";
import {
  getStudentNotes,
  createStudentNote,
} from "@/lib/services/students";

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
    const notes = await getStudentNotes(tenant, id);
    return NextResponse.json(notes);
  } catch (err) {
    console.error("[students/id/notes] GET error:", err);
    return NextResponse.json(
      { error: "Error al cargar notas" },
      { status: 500 },
    );
  }
}

export async function POST(
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
    const body = await request.json();
    const content: string = body.content;
    const category: string = body.category || "general";

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "El contenido de la nota es obligatorio" },
        { status: 400 },
      );
    }

    const note = await createStudentNote(
      tenant,
      id,
      session.user.id,
      content.trim(),
      category,
    );

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error("[students/id/notes] POST error:", err);
    return NextResponse.json(
      { error: "Error al crear nota" },
      { status: 500 },
    );
  }
}

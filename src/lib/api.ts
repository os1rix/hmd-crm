import { NextResponse } from "next/server";
import type { ZodError, ZodSchema } from "zod";

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    {
      error: "Validation failed",
      details: error.flatten().fieldErrors,
    },
    { status: 400 },
  );
}

export async function parseJsonBody<T>(request: Request, schema: ZodSchema<T>) {
  const body: unknown = await request.json();
  return schema.safeParse(body);
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

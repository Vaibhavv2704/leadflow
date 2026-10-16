import { NextResponse } from "next/server";
import { z } from "zod";
export const ok = (data: unknown, status = 200) => NextResponse.json({ data }, { status, headers: { "Cache-Control": "no-store" } });
export async function body<T extends z.ZodType>(request: Request, schema: T): Promise<z.output<T>> {
  let input: unknown;
  try { input = await request.json(); } catch { throw new InvalidJsonError(); }
  return schema.parse(input);
}
class InvalidJsonError extends Error {}
export function failure(error: unknown) {
  if (error instanceof z.ZodError) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Please check the submitted fields.", fields: z.flattenError(error).fieldErrors } }, { status: 400 });
  if (error instanceof InvalidJsonError) return NextResponse.json({ error: { code: "INVALID_JSON", message: "Send a valid JSON request body." } }, { status: 400 });
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") return notFound();
  console.error("LeadFlow API request failed", error instanceof Error ? error.name : "Unknown error");
  return NextResponse.json({ error: { code: "SERVER_ERROR", message: "We couldn't complete this request. Please try again." } }, { status: 500 });
}
export function notFound() { return NextResponse.json({ error: { code: "NOT_FOUND", message: "This lead could not be found." } }, { status: 404 }); }

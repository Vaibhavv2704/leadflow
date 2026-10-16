import { leadService } from "@/lib/server/lead-service";
import { body, failure, ok } from "@/lib/server/http";
import { createLeadSchema } from "@/lib/validations/leads";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return ok(await leadService.list());
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    return ok(
      await leadService.create(await body(request, createLeadSchema)),
      201,
    );
  } catch (error) {
    return failure(error);
  }
}

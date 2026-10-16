import { leadService } from "@/lib/server/lead-service";
import { body, failure, notFound, ok } from "@/lib/server/http";
import { patchLeadSchema } from "@/lib/validations/leads";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const lead = await leadService.detail((await context.params).id);
    return lead ? ok(lead) : notFound();
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const input = await body(request, patchLeadSchema);
    return ok(await leadService.patch((await context.params).id, input));
  } catch (error) {
    return failure(error);
  }
}

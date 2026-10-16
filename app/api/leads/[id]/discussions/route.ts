import { leadService } from "@/lib/server/lead-service";
import { body, failure, ok } from "@/lib/server/http";
import { discussionSchema } from "@/lib/validations/leads";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const input = await body(request, discussionSchema);
    return ok(
      await leadService.addDiscussion((await context.params).id, input),
      201,
    );
  } catch (error) {
    return failure(error);
  }
}

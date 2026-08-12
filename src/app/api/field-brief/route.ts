import { createAIProvider } from "@/services/ai.service";
import { errorResponse, AppError } from "@/lib/errors";
import { checkRateLimit, requestIdentity } from "@/lib/rate-limit";
import { fieldBriefInputSchema } from "@/schemas/field-brief.schema";

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit(`ai:${requestIdentity(request)}`, 8, 60_000);
    if (!limit.allowed)
      throw new AppError(
        "RATE_LIMITED",
        "Field brief rate limit reached.",
        429,
      );
    const input = fieldBriefInputSchema.parse(await request.json());
    const brief = await createAIProvider().generateFieldBrief(input);
    return Response.json({ data: brief });
  } catch (error) {
    return errorResponse(error);
  }
}

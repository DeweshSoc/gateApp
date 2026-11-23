import { z } from "zod";
import { connectToDatabase } from "@/lib/db/client";
import { Message } from "@/lib/db/models";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { toMessageDTO } from "@/lib/serialize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  isImportant: z.boolean().optional(),
  content: z.string().min(1).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    const body = await readJson(request);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid message update.", 422);
    }

    await connectToDatabase();
    const message = await Message.findByIdAndUpdate(id, parsed.data, {
      new: true,
    }).lean();
    if (!message) return fail("NOT_FOUND", "Message not found.", 404);

    return ok(toMessageDTO(message));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) return fail("NOT_FOUND", "Message not found.", 404);
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}

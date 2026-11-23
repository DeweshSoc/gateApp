import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/client";
import { handleError, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await connectToDatabase();
    const state = mongoose.connection.readyState;
    return ok({
      status: "ok",
      database: state === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}

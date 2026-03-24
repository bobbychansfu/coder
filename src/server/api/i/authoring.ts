import { TRPCError } from "@trpc/server";
import { NextRequest, NextResponse } from "next/server";
import { appRouter } from "@/server/trpc/routers";
import { createContext } from "@/server/trpc/init";

function getStatusFromTrpcError(error: TRPCError) {
  switch (error.code) {
    case "BAD_REQUEST":
    case "PARSE_ERROR":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "PRECONDITION_FAILED":
      return 412;
    case "PAYLOAD_TOO_LARGE":
      return 413;
    case "METHOD_NOT_SUPPORTED":
      return 405;
    case "UNPROCESSABLE_CONTENT":
      return 422;
    case "TOO_MANY_REQUESTS":
      return 429;
    default:
      return 500;
  }
}

async function getCaller() {
  return appRouter.createCaller(await createContext());
}

export async function handlePatchProblem(
  request: NextRequest,
  problemId: string,
) {
  try {
    const body = await request.json();
    const caller = await getCaller();
    const result = await caller.problemAuthoring.updateProblem({
      problemId,
      data: body,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TRPCError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: getStatusFromTrpcError(error) },
      );
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function handlePatchContest(
  request: NextRequest,
  contestId: string,
) {
  try {
    const body = await request.json();
    const caller = await getCaller();
    const result = await caller.contestAuthoring.updateContest({
      contestId,
      data: body,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TRPCError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: getStatusFromTrpcError(error) },
      );
    }

    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

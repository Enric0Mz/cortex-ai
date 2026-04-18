import {
  NotFoundError,
  ValidationError,
  ServiceUnavailableError,
} from "@/lib/errors";
import { err, type Result } from "@/lib/result";
import type { CreateVoteRequest, GetVoteResponse, VoteResponse } from "./schemas";
import {
  findResponseInComparison,
  findVoteByComparisonAndUser,
  getAnonymousUserId,
  upsertVote,
} from "./repository";

export async function castVote(
  comparisonId: string,
  input: CreateVoteRequest,
): Promise<Result<VoteResponse, ValidationError | ServiceUnavailableError>> {
  const userResult = await getAnonymousUserId();
  if (!userResult.ok) return err(userResult.error);
  const userId = userResult.value;

  const responseResult = await findResponseInComparison(
    comparisonId,
    input.responseId,
  );
  if (!responseResult.ok) return err(responseResult.error);
  if (!responseResult.value) {
    return err(
      new ValidationError("responseId must belong to the provided comparisonId"),
    );
  }

  const voteResult = await upsertVote(comparisonId, input.responseId, userId);
  if (!voteResult.ok) return err(voteResult.error);

  const vote = voteResult.value;
  return {
    ok: true,
    value: {
      id: vote.id,
      comparisonId: vote.comparisonId,
      responseId: vote.responseId,
      userId: vote.userId,
      createdAt: vote.createdAt.toISOString(),
    },
  };
}

export async function getVote(
  comparisonId: string,
): Promise<Result<GetVoteResponse, NotFoundError | ServiceUnavailableError>> {
  const userResult = await getAnonymousUserId();
  if (!userResult.ok) return err(userResult.error);
  const userId = userResult.value;

  const voteResult = await findVoteByComparisonAndUser(comparisonId, userId);
  if (!voteResult.ok) return err(voteResult.error);
  if (!voteResult.value) {
    return err(new NotFoundError("vote"));
  }

  const vote = voteResult.value;
  return {
    ok: true,
    value: {
      id: vote.id,
      comparisonId: vote.comparisonId,
      responseId: vote.responseId,
      userId: vote.userId,
      createdAt: vote.createdAt.toISOString(),
    },
  };
}

import { ValidationError, ServiceUnavailableError } from "@/lib/errors";
import { err, type Result } from "@/lib/result";
import type { CreateVoteRequest, VoteResponse } from "./schemas";
import {
  findResponseInComparison,
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

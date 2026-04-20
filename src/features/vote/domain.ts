import {
  NotFoundError,
  ValidationError,
  ServiceUnavailableError,
} from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import type { CreateVoteRequest, VoteResponse } from "./schemas";
import {
  findResponseInComparison,
  findVoteByComparisonAndUser,
  upsertVote,
} from "./repository";

type VoteRow = {
  id: string;
  comparisonId: string;
  responseId: string;
  userId: string;
  createdAt: Date;
};

function toVoteResponse(vote: VoteRow): VoteResponse {
  return {
    id: vote.id,
    comparisonId: vote.comparisonId,
    responseId: vote.responseId,
    userId: vote.userId,
    createdAt: vote.createdAt.toISOString(),
  };
}

export async function castVote(
  comparisonId: string,
  userId: string,
  input: CreateVoteRequest,
): Promise<Result<VoteResponse, ValidationError | ServiceUnavailableError>> {
  const responseResult = await findResponseInComparison(
    comparisonId,
    input.responseId,
  );
  if (!responseResult.ok) return err(responseResult.error);
  if (!responseResult.value) {
    return err(
      new ValidationError(
        "responseId must belong to the provided comparisonId",
      ),
    );
  }

  const voteResult = await upsertVote(comparisonId, input.responseId, userId);
  if (!voteResult.ok) return err(voteResult.error);

  return ok(toVoteResponse(voteResult.value));
}

export async function getVote(
  comparisonId: string,
  userId: string,
): Promise<Result<VoteResponse, NotFoundError | ServiceUnavailableError>> {
  const voteResult = await findVoteByComparisonAndUser(comparisonId, userId);
  if (!voteResult.ok) return err(voteResult.error);
  if (!voteResult.value) {
    return err(new NotFoundError("vote"));
  }

  return ok(toVoteResponse(voteResult.value));
}

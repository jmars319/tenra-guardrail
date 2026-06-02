import type {
  ExternalActionReviewDecision,
  ExternalActionReviewRequest
} from "@guardrail/api-contracts";

export type ReviewQueueItem = {
  request: ExternalActionReviewRequest;
  importedAt: string;
  decision?: ExternalActionReviewDecision | undefined;
  callback?:
    | {
        endpoint?: string | undefined;
        status: "not-configured" | "sent" | "failed";
        message?: string | undefined;
        deliveredAt?: string | undefined;
      }
    | undefined;
};

export type QueueResponse = {
  ok?: boolean;
  items?: ReviewQueueItem[];
  errors?: string[];
};

import { render } from "@react-email/render";
import { ServiceUnavailableError } from "@/lib/errors";
import { tryCatch, ok, err, type Result } from "@/lib/result";
import { env } from "@/lib/env";
import { getResend, isEmailEnabled } from "./resend";
import { ConfirmEmail } from "./templates/confirm-email";

type Args = {
  to: string;
  name?: string | null;
  confirmationUrl: string;
};

export type CapturedEmail = {
  to: string;
  subject: string;
  confirmationUrl: string;
  sentAt: string;
};

const captured: CapturedEmail[] = [];

export function getCapturedEmails(): readonly CapturedEmail[] {
  return captured;
}

export function clearCapturedEmails(): void {
  captured.length = 0;
}

const SUBJECT = "Confirm your Cortex AI account";

export async function sendConfirmationEmail(
  args: Args,
): Promise<Result<void, ServiceUnavailableError>> {
  if (env.EMAIL_CAPTURE) {
    captured.push({
      to: args.to,
      subject: SUBJECT,
      confirmationUrl: args.confirmationUrl,
      sentAt: new Date().toISOString(),
    });
    return ok(undefined);
  }
  if (!isEmailEnabled()) {
    return err(new ServiceUnavailableError("email"));
  }

  return tryCatch(
    async () => {
      const html = await render(
        ConfirmEmail({
          name: args.name ?? null,
          confirmationUrl: args.confirmationUrl,
        }),
      );
      const text =
        `Welcome to Cortex AI\n\n` +
        `Confirm your email by visiting:\n${args.confirmationUrl}\n\n` +
        `If you didn't create a Cortex AI account, you can ignore this email.`;
      const result = await getResend().emails.send({
        from: env.EMAIL_FROM,
        to: args.to,
        subject: SUBJECT,
        html,
        text,
      });
      if (result.error) {
        throw result.error;
      }
    },
    (cause) => new ServiceUnavailableError("email", cause),
  );
}

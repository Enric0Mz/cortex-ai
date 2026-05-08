import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  name?: string | null;
  confirmationUrl: string;
};

export function ConfirmEmail({ name, confirmationUrl }: Props) {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return (
    <Html>
      <Head />
      <Preview>Confirm your Cortex AI account</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>Welcome to Cortex AI</Text>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            Click the button below to confirm your email and finish creating
            your account.
          </Text>
          <Section style={buttonWrap}>
            <Button href={confirmationUrl} style={button}>
              Confirm my email
            </Button>
          </Section>
          <Text style={paragraph}>
            If the button doesn&apos;t work, paste this link into your browser:
          </Text>
          <Text style={fallback}>{confirmationUrl}</Text>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn&apos;t create a Cortex AI account, you can safely ignore
            this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "32px",
  maxWidth: "520px",
  borderRadius: "8px",
};

const heading = {
  fontSize: "20px",
  fontWeight: 600,
  color: "#111111",
  marginBottom: "16px",
};

const paragraph = {
  fontSize: "15px",
  color: "#333333",
  lineHeight: "22px",
  margin: "12px 0",
};

const buttonWrap = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#111111",
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 600,
};

const fallback = {
  fontSize: "13px",
  color: "#555555",
  wordBreak: "break-all" as const,
};

const hr = {
  borderTop: "1px solid #eeeeee",
  margin: "24px 0",
};

const footer = {
  fontSize: "12px",
  color: "#888888",
};

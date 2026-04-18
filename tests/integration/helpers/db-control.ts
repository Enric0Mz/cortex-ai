import { Client } from "pg";

function getTestDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return databaseUrl;
}

function parseDatabaseName(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.replace(/^\//, "");

  if (!databaseName) {
    throw new Error("DATABASE_URL does not include a database name");
  }

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(databaseName)) {
    throw new Error(`Unsupported database name: ${databaseName}`);
  }

  return databaseName;
}

function buildAdminConnectionUrl(databaseUrl: string): string {
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";
  return adminUrl.toString();
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function withAdminClient<T>(
  databaseUrl: string,
  operation: (client: Client, databaseName: string) => Promise<T>,
): Promise<T> {
  const databaseName = parseDatabaseName(databaseUrl);
  const adminConnectionUrl = buildAdminConnectionUrl(databaseUrl);
  const client = new Client({ connectionString: adminConnectionUrl });

  await client.connect();
  try {
    return await operation(client, databaseName);
  } finally {
    await client.end();
  }
}

export async function disableDatabaseConnections(): Promise<void> {
  const databaseUrl = getTestDatabaseUrl();

  await withAdminClient(databaseUrl, async (client, databaseName) => {
    await client.query(
      `ALTER DATABASE ${quoteIdentifier(databaseName)} WITH ALLOW_CONNECTIONS false`,
    );
    await client.query(
      `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1
          AND pid <> pg_backend_pid()
      `,
      [databaseName],
    );
  });
}

export async function enableDatabaseConnections(): Promise<void> {
  const databaseUrl = getTestDatabaseUrl();

  await withAdminClient(databaseUrl, async (client, databaseName) => {
    await client.query(
      `ALTER DATABASE ${quoteIdentifier(databaseName)} WITH ALLOW_CONNECTIONS true`,
    );
  });
}

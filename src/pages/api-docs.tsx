import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";

const SWAGGER_VERSION = "5.17.14";
const SWAGGER_CSS = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css`;
const SWAGGER_JS = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js`;

declare global {
  interface Window {
    SwaggerUIBundle?: (opts: {
      url: string;
      dom_id: string;
      deepLinking?: boolean;
    }) => void;
  }
}

const ApiDocsPage: NextPage = () => {
  useEffect(() => {
    if (!document.querySelector(`link[href="${SWAGGER_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = SWAGGER_CSS;
      document.head.appendChild(link);
    }

    const init = (): void => {
      if (typeof window.SwaggerUIBundle !== "function") return;
      window.SwaggerUIBundle({
        url: "/api/v1/openapi",
        dom_id: "#swagger-ui",
        deepLinking: true,
      });
    };

    if (typeof window.SwaggerUIBundle === "function") {
      init();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SWAGGER_JS}"]`,
    );
    if (existing) {
      existing.addEventListener("load", init, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = SWAGGER_JS;
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, []);

  return (
    <>
      <Head>
        <title>Cortex AI API — Docs</title>
        <style>{`
          html, body { background: #fafafa !important; color: #3b4151; }
          #swagger-ui { min-height: 100vh; }
        `}</style>
      </Head>
      <div id="swagger-ui" />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const isProd = process.env.NODE_ENV === "production";
  const enabled = process.env.ENABLE_API_DOCS === "true";
  if (isProd && !enabled) {
    return { notFound: true };
  }
  return { props: {} };
};

export default ApiDocsPage;

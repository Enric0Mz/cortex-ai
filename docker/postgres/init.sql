-- Runs once on first container start (when the data volume is empty).
-- Creates the test database alongside the dev database so Playwright and
-- any other integration tests have an isolated schema to work against.
CREATE DATABASE cortex_ai_test;

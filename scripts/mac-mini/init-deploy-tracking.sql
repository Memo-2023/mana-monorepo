-- Deploy Tracking Schema
-- Run once: docker exec -i mana-infra-postgres psql -U postgres -d mana < scripts/mac-mini/init-deploy-tracking.sql
-- All statements are idempotent (IF NOT EXISTS).

CREATE SCHEMA IF NOT EXISTS deploy_tracking;

-- One row per CI/CD run
CREATE TABLE IF NOT EXISTS deploy_tracking.deployments (
    id              BIGSERIAL PRIMARY KEY,
    run_id          BIGINT NOT NULL,
    run_attempt     INTEGER NOT NULL DEFAULT 1,
    commit_sha      VARCHAR(40) NOT NULL,
    commit_message  TEXT,
    branch          VARCHAR(255) NOT NULL DEFAULT 'main',
    trigger         VARCHAR(20) NOT NULL,
    deployer        VARCHAR(255),
    services        TEXT[],
    status          VARCHAR(20) NOT NULL DEFAULT 'running',
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    duration_s      NUMERIC(10,2)
);

-- One row per service per deploy
CREATE TABLE IF NOT EXISTS deploy_tracking.deploy_services (
    id                BIGSERIAL PRIMARY KEY,
    deployment_id     BIGINT NOT NULL REFERENCES deploy_tracking.deployments(id) ON DELETE CASCADE,
    service_name      VARCHAR(100) NOT NULL,
    build_duration_s  NUMERIC(10,2),
    image_size_mb     NUMERIC(10,2),
    startup_time_s    NUMERIC(10,2),
    health_status     VARCHAR(10),
    health_http_code  INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deployments_started_at ON deploy_tracking.deployments (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deploy_tracking.deployments (status);
CREATE INDEX IF NOT EXISTS idx_deploy_services_deployment_id ON deploy_tracking.deploy_services (deployment_id);
CREATE INDEX IF NOT EXISTS idx_deploy_services_service_name ON deploy_tracking.deploy_services (service_name);

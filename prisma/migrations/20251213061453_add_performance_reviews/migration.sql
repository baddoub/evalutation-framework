-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keycloak_id" TEXT NOT NULL,
    "roles" TEXT[] DEFAULT ARRAY['user']::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "level" TEXT,
    "department" TEXT,
    "job_title" TEXT,
    "manager_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_cycles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "self_review_deadline" TIMESTAMP(3) NOT NULL,
    "peer_feedback_deadline" TIMESTAMP(3) NOT NULL,
    "manager_eval_deadline" TIMESTAMP(3) NOT NULL,
    "calibration_deadline" TIMESTAMP(3) NOT NULL,
    "feedback_delivery_deadline" TIMESTAMP(3) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "review_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "self_reviews" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_impact_score" INTEGER NOT NULL,
    "direction_score" INTEGER NOT NULL,
    "engineering_excellence_score" INTEGER NOT NULL,
    "operational_ownership_score" INTEGER NOT NULL,
    "people_impact_score" INTEGER NOT NULL,
    "narrative" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "self_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_nominations" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "nominator_id" TEXT NOT NULL,
    "nominee_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "decline_reason" TEXT,
    "nominated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peer_nominations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_feedback" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "reviewee_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "project_impact_score" INTEGER NOT NULL,
    "direction_score" INTEGER NOT NULL,
    "engineering_excellence_score" INTEGER NOT NULL,
    "operational_ownership_score" INTEGER NOT NULL,
    "people_impact_score" INTEGER NOT NULL,
    "strengths" TEXT,
    "growth_areas" TEXT,
    "general_comments" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "peer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_evaluations" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "project_impact_score" INTEGER NOT NULL,
    "direction_score" INTEGER NOT NULL,
    "engineering_excellence_score" INTEGER NOT NULL,
    "operational_ownership_score" INTEGER NOT NULL,
    "people_impact_score" INTEGER NOT NULL,
    "narrative" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "growth_areas" TEXT NOT NULL,
    "development_plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "calibrated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "manager_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_sessions" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "facilitator_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "participant_ids" TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calibration_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_adjustments" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "adjusted_by" TEXT NOT NULL,
    "original_project_impact" INTEGER NOT NULL,
    "original_direction" INTEGER NOT NULL,
    "original_engineering_excellence" INTEGER NOT NULL,
    "original_operational_ownership" INTEGER NOT NULL,
    "original_people_impact" INTEGER NOT NULL,
    "adjusted_project_impact" INTEGER NOT NULL,
    "adjusted_direction" INTEGER NOT NULL,
    "adjusted_engineering_excellence" INTEGER NOT NULL,
    "adjusted_operational_ownership" INTEGER NOT NULL,
    "adjusted_people_impact" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "adjusted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibration_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_adjustment_requests" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "approver_id" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "proposed_project_impact" INTEGER NOT NULL,
    "proposed_direction" INTEGER NOT NULL,
    "proposed_engineering_excellence" INTEGER NOT NULL,
    "proposed_operational_ownership" INTEGER NOT NULL,
    "proposed_people_impact" INTEGER NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "score_adjustment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "final_scores" (
    "id" TEXT NOT NULL,
    "cycle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_impact_score" INTEGER NOT NULL,
    "direction_score" INTEGER NOT NULL,
    "engineering_excellence_score" INTEGER NOT NULL,
    "operational_ownership_score" INTEGER NOT NULL,
    "people_impact_score" INTEGER NOT NULL,
    "weighted_score" DOUBLE PRECISION NOT NULL,
    "percentage_score" DOUBLE PRECISION NOT NULL,
    "bonus_tier" TEXT NOT NULL,
    "peer_avg_project_impact" DOUBLE PRECISION,
    "peer_avg_direction" DOUBLE PRECISION,
    "peer_avg_engineering_excellence" DOUBLE PRECISION,
    "peer_avg_operational_ownership" DOUBLE PRECISION,
    "peer_avg_people_impact" DOUBLE PRECISION,
    "peer_feedback_count" INTEGER,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_at" TIMESTAMP(3),
    "feedback_delivered" BOOLEAN NOT NULL DEFAULT false,
    "feedback_delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "final_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ParticipantSessions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ParticipantSessions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_keycloak_id_key" ON "users"("keycloak_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_keycloak_id_idx" ON "users"("keycloak_id");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_manager_id_idx" ON "users"("manager_id");

-- CreateIndex
CREATE INDEX "users_department_idx" ON "users"("department");

-- CreateIndex
CREATE INDEX "users_level_idx" ON "users"("level");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "sessions_device_id_idx" ON "sessions"("device_id");

-- CreateIndex
CREATE INDEX "review_cycles_status_idx" ON "review_cycles"("status");

-- CreateIndex
CREATE INDEX "review_cycles_year_idx" ON "review_cycles"("year");

-- CreateIndex
CREATE UNIQUE INDEX "review_cycles_year_name_key" ON "review_cycles"("year", "name");

-- CreateIndex
CREATE INDEX "self_reviews_user_id_idx" ON "self_reviews"("user_id");

-- CreateIndex
CREATE INDEX "self_reviews_status_idx" ON "self_reviews"("status");

-- CreateIndex
CREATE UNIQUE INDEX "self_reviews_cycle_id_user_id_key" ON "self_reviews"("cycle_id", "user_id");

-- CreateIndex
CREATE INDEX "peer_nominations_nominator_id_idx" ON "peer_nominations"("nominator_id");

-- CreateIndex
CREATE INDEX "peer_nominations_nominee_id_idx" ON "peer_nominations"("nominee_id");

-- CreateIndex
CREATE INDEX "peer_nominations_status_idx" ON "peer_nominations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "peer_nominations_cycle_id_nominator_id_nominee_id_key" ON "peer_nominations"("cycle_id", "nominator_id", "nominee_id");

-- CreateIndex
CREATE INDEX "peer_feedback_reviewee_id_idx" ON "peer_feedback"("reviewee_id");

-- CreateIndex
CREATE INDEX "peer_feedback_reviewer_id_idx" ON "peer_feedback"("reviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "peer_feedback_cycle_id_reviewee_id_reviewer_id_key" ON "peer_feedback"("cycle_id", "reviewee_id", "reviewer_id");

-- CreateIndex
CREATE INDEX "manager_evaluations_employee_id_idx" ON "manager_evaluations"("employee_id");

-- CreateIndex
CREATE INDEX "manager_evaluations_manager_id_idx" ON "manager_evaluations"("manager_id");

-- CreateIndex
CREATE INDEX "manager_evaluations_status_idx" ON "manager_evaluations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "manager_evaluations_cycle_id_employee_id_key" ON "manager_evaluations"("cycle_id", "employee_id");

-- CreateIndex
CREATE INDEX "calibration_sessions_cycle_id_idx" ON "calibration_sessions"("cycle_id");

-- CreateIndex
CREATE INDEX "calibration_sessions_department_idx" ON "calibration_sessions"("department");

-- CreateIndex
CREATE INDEX "calibration_sessions_status_idx" ON "calibration_sessions"("status");

-- CreateIndex
CREATE INDEX "calibration_adjustments_session_id_idx" ON "calibration_adjustments"("session_id");

-- CreateIndex
CREATE INDEX "calibration_adjustments_evaluation_id_idx" ON "calibration_adjustments"("evaluation_id");

-- CreateIndex
CREATE INDEX "score_adjustment_requests_employee_id_idx" ON "score_adjustment_requests"("employee_id");

-- CreateIndex
CREATE INDEX "score_adjustment_requests_status_idx" ON "score_adjustment_requests"("status");

-- CreateIndex
CREATE INDEX "final_scores_user_id_idx" ON "final_scores"("user_id");

-- CreateIndex
CREATE INDEX "final_scores_bonus_tier_idx" ON "final_scores"("bonus_tier");

-- CreateIndex
CREATE INDEX "final_scores_locked_idx" ON "final_scores"("locked");

-- CreateIndex
CREATE UNIQUE INDEX "final_scores_cycle_id_user_id_key" ON "final_scores"("cycle_id", "user_id");

-- CreateIndex
CREATE INDEX "_ParticipantSessions_B_index" ON "_ParticipantSessions"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "self_reviews" ADD CONSTRAINT "self_reviews_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "self_reviews" ADD CONSTRAINT "self_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_nominations" ADD CONSTRAINT "peer_nominations_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_nominations" ADD CONSTRAINT "peer_nominations_nominator_id_fkey" FOREIGN KEY ("nominator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_nominations" ADD CONSTRAINT "peer_nominations_nominee_id_fkey" FOREIGN KEY ("nominee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_feedback" ADD CONSTRAINT "peer_feedback_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_feedback" ADD CONSTRAINT "peer_feedback_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_feedback" ADD CONSTRAINT "peer_feedback_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_evaluations" ADD CONSTRAINT "manager_evaluations_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_evaluations" ADD CONSTRAINT "manager_evaluations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_evaluations" ADD CONSTRAINT "manager_evaluations_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_sessions" ADD CONSTRAINT "calibration_sessions_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_sessions" ADD CONSTRAINT "calibration_sessions_facilitator_id_fkey" FOREIGN KEY ("facilitator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_adjustments" ADD CONSTRAINT "calibration_adjustments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "calibration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_adjustments" ADD CONSTRAINT "calibration_adjustments_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "manager_evaluations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_adjustments" ADD CONSTRAINT "calibration_adjustments_adjusted_by_fkey" FOREIGN KEY ("adjusted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_adjustment_requests" ADD CONSTRAINT "score_adjustment_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_adjustment_requests" ADD CONSTRAINT "score_adjustment_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_scores" ADD CONSTRAINT "final_scores_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "review_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_scores" ADD CONSTRAINT "final_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantSessions" ADD CONSTRAINT "_ParticipantSessions_A_fkey" FOREIGN KEY ("A") REFERENCES "calibration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantSessions" ADD CONSTRAINT "_ParticipantSessions_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

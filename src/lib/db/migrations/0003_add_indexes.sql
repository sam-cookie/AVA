CREATE INDEX IF NOT EXISTS idx_transactions_fund_id ON transactions(fund_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON transactions(transfer_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_utang_payments_utang_id ON utang_payments(utang_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON goal_contributions(goal_id);

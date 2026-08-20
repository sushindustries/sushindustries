CREATE INDEX "api_tokens_account_id_idx" ON "api_tokens" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "magic_links_invited_by_idx" ON "magic_links" USING btree ("invited_by");--> statement-breakpoint
CREATE INDEX "magic_links_token_id_idx" ON "magic_links" USING btree ("token_id");
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_email" varchar NOT NULL,
	"organization_name" varchar NOT NULL,
	"organization_logo" varchar,
	"organization_type" varchar NOT NULL,
	"status" varchar DEFAULT 'ACTIVE',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "clients_organization_email_unique" UNIQUE("organization_email")
);
--> statement-breakpoint
CREATE INDEX "email_idx" ON "clients" USING btree ("organization_email");
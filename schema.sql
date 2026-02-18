CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"password" text NOT NULL,
	"role" text DEFAULT 'USER' NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"serial_number" text NOT NULL,
	"purchase_date" date NOT NULL,
	"status" text DEFAULT 'AVAILABLE' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "asset_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL REFERENCES "assets"("id"),
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"assigned_date" timestamp DEFAULT now() NOT NULL,
	"returned_date" timestamp,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

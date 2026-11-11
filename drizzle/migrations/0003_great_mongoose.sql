CREATE TYPE "public"."return_request_status" AS ENUM('REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "rental_return_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"rider_id" uuid NOT NULL,
	"preferred_return_at" timestamp with time zone NOT NULL,
	"preferred_location" varchar(255) NOT NULL,
	"odometer_reading" integer,
	"condition_declaration" text NOT NULL,
	"rider_notes" text,
	"status" "return_request_status" DEFAULT 'REQUESTED' NOT NULL,
	"confirmed_return_at" timestamp with time zone,
	"confirmed_location" varchar(255),
	"admin_notes" text,
	"confirmed_by" uuid,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rental_return_requests" ADD CONSTRAINT "rental_return_requests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_return_requests" ADD CONSTRAINT "rental_return_requests_rider_id_rider_profiles_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_return_requests" ADD CONSTRAINT "rental_return_requests_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

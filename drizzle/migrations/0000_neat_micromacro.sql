CREATE TYPE "public"."document_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."rider_document_type" AS ENUM('AADHAAR', 'DRIVING_LICENCE', 'PAN', 'POLICE_CLEARANCE', 'PROFILE_PHOTO');--> statement-breakpoint
CREATE TYPE "public"."rider_verification_status" AS ENUM('UNVERIFIED', 'DOCUMENTS_PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."vehicle_compliance_status" AS ENUM('PENDING_REVIEW', 'VERIFIED_COMPLIANT', 'RESTRICTED_USE', 'EXPIRED_DOCS', 'NON_COMPLIANT');--> statement-breakpoint
CREATE TYPE "public"."vehicle_document_type" AS ENUM('RC', 'INSURANCE', 'PUC', 'ROAD_TAX', 'FITNESS', 'PERMIT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."vehicle_operational_status" AS ENUM('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'ACCIDENT', 'UNAVAILABLE', 'RETIRED');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'ACTIVE', 'EXTENSION_PENDING', 'COMPLETED', 'CANCELLED', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."assignment_reason" AS ENUM('INITIAL_ASSIGNMENT', 'MAINTENANCE_REPLACEMENT', 'ACCIDENT_REPLACEMENT', 'OTHER_APPROVED_REASON');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('ACTIVE', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."inspection_type" AS ENUM('HANDOVER', 'RETURN', 'MAINTENANCE_RELEASE', 'ACCIDENT_ASSESSMENT');--> statement-breakpoint
CREATE TYPE "public"."deposit_transaction_type" AS ENUM('RECEIVED', 'REFUNDED', 'FORFEITED_DAMAGE', 'FORFEITED_PENALTY');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('UPI', 'BANK_TRANSFER', 'CASH', 'CARD');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('BOOKING_TOKEN', 'RENTAL_BALANCE', 'SECURITY_DEPOSIT', 'EXTENSION', 'LATE_FEE', 'DAMAGE_CHARGE', 'REFUND');--> statement-breakpoint
CREATE TYPE "public"."maintenance_category" AS ENUM('SCHEDULED_SERVICE', 'ENGINE', 'BRAKE', 'TYRE', 'BATTERY', 'ELECTRICAL', 'BREAKDOWN', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('REPORTED', 'IN_PROGRESS', 'AWAITING_PARTS', 'AWAITING_RELEASE_INSPECTION', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role" varchar(50) DEFAULT 'RIDER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_phone_verified" boolean DEFAULT false NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "rider_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rider_id" uuid NOT NULL,
	"document_type" "rider_document_type" NOT NULL,
	"document_number" varchar(100),
	"storage_key" varchar(500) NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"expiry_date" date,
	"verification_status" "document_status" DEFAULT 'PENDING' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"rejection_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rider_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"date_of_birth" date NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255) NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" varchar(100) DEFAULT 'Kochi' NOT NULL,
	"state" varchar(100) DEFAULT 'Kerala' NOT NULL,
	"pincode" varchar(10) NOT NULL,
	"emergency_contact_name" varchar(150) NOT NULL,
	"emergency_contact_phone" varchar(20) NOT NULL,
	"emergency_contact_relation" varchar(50) NOT NULL,
	"verification_status" "rider_verification_status" DEFAULT 'UNVERIFIED' NOT NULL,
	"account_status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"rejection_reason" text,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rider_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "vehicle_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"document_type" "vehicle_document_type" NOT NULL,
	"document_number" varchar(100) NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"valid_from" date NOT NULL,
	"valid_until" date NOT NULL,
	"is_commercial_permit" boolean DEFAULT false NOT NULL,
	"verification_status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"photo_type" varchar(50) NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"caption" varchar(255),
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"from_status" "vehicle_operational_status" NOT NULL,
	"to_status" "vehicle_operational_status" NOT NULL,
	"reason" varchar(255) NOT NULL,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_number" varchar(30) NOT NULL,
	"manufacturer" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"variant" varchar(50),
	"manufacturing_year" smallint NOT NULL,
	"fuel_type" varchar(30) DEFAULT 'PETROL' NOT NULL,
	"vehicle_category" varchar(50) DEFAULT 'SCOOTER' NOT NULL,
	"chassis_number" varchar(100) NOT NULL,
	"engine_number" varchar(100) NOT NULL,
	"purchase_date" date NOT NULL,
	"purchase_cost" numeric(12, 2) DEFAULT '70000.00' NOT NULL,
	"current_odometer" integer DEFAULT 0 NOT NULL,
	"operational_status" "vehicle_operational_status" DEFAULT 'AVAILABLE' NOT NULL,
	"compliance_status" "vehicle_compliance_status" DEFAULT 'PENDING_REVIEW' NOT NULL,
	"compliance_notes" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_registration_number_unique" UNIQUE("registration_number"),
	CONSTRAINT "vehicles_chassis_number_unique" UNIQUE("chassis_number"),
	CONSTRAINT "vehicles_engine_number_unique" UNIQUE("engine_number")
);
--> statement-breakpoint
CREATE TABLE "rental_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"duration_days" integer NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" smallint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rental_packages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "vehicle_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"daily_rate" numeric(10, 2) NOT NULL,
	"package_total_rate" numeric(10, 2) NOT NULL,
	"booking_token_amount" numeric(10, 2) DEFAULT '1000.00' NOT NULL,
	"security_deposit_amount" numeric(10, 2) DEFAULT '4000.00' NOT NULL,
	"km_limit_per_day" integer DEFAULT 100 NOT NULL,
	"extra_km_charge" numeric(10, 2) DEFAULT '4.00' NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_extensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"additional_days" integer NOT NULL,
	"previous_end_date" date NOT NULL,
	"new_end_date" date NOT NULL,
	"daily_rate_applied" numeric(10, 2) NOT NULL,
	"additional_rental_amount" numeric(10, 2) NOT NULL,
	"payment_id" uuid,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"requested_by" uuid NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_price_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"package_code" varchar(50) NOT NULL,
	"duration_days" integer NOT NULL,
	"daily_rate" numeric(10, 2) NOT NULL,
	"total_rental_price" numeric(10, 2) NOT NULL,
	"booking_token_amount" numeric(10, 2) NOT NULL,
	"remaining_rental_balance" numeric(10, 2) NOT NULL,
	"security_deposit_amount" numeric(10, 2) NOT NULL,
	"km_limit_total" integer NOT NULL,
	"extra_km_charge" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"approved_by" uuid,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_price_snapshots_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_number" varchar(50) NOT NULL,
	"rider_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_duration_days" integer NOT NULL,
	"booking_status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"cancellation_reason" text,
	"cancelled_by" uuid,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_number_unique" UNIQUE("booking_number")
);
--> statement-breakpoint
CREATE TABLE "vehicle_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"rider_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"assignment_start" timestamp with time zone DEFAULT now() NOT NULL,
	"assignment_end" timestamp with time zone,
	"assignment_reason" "assignment_reason" DEFAULT 'INITIAL_ASSIGNMENT' NOT NULL,
	"previous_assignment_id" uuid,
	"starting_odometer" integer NOT NULL,
	"ending_odometer" integer,
	"status" "assignment_status" DEFAULT 'ACTIVE' NOT NULL,
	"handover_inspection_id" uuid,
	"return_inspection_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspection_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_id" uuid NOT NULL,
	"photo_angle" varchar(50) NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"caption" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_number" varchar(50) NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"assignment_id" uuid,
	"inspection_type" "inspection_type" NOT NULL,
	"odometer_reading" integer NOT NULL,
	"fuel_percentage" smallint NOT NULL,
	"cleanliness_rating" varchar(30) DEFAULT 'CLEAN' NOT NULL,
	"condition_rating" varchar(30) DEFAULT 'GOOD' NOT NULL,
	"damages_noted" text,
	"estimated_damage_cost" numeric(10, 2) DEFAULT '0.00',
	"inspector_id" uuid NOT NULL,
	"rider_signature_storage_key" varchar(500),
	"inspected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_inspections_inspection_number_unique" UNIQUE("inspection_number")
);
--> statement-breakpoint
CREATE TABLE "deposit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"rider_id" uuid NOT NULL,
	"transaction_type" "deposit_transaction_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"running_balance" numeric(12, 2) NOT NULL,
	"payment_id" uuid,
	"settlement_notes" text,
	"recorded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_capitalized" boolean DEFAULT false NOT NULL,
	CONSTRAINT "expense_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_number" varchar(50) NOT NULL,
	"category_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"expense_date" date NOT NULL,
	"vendor_name" varchar(150),
	"payment_method" "payment_method" DEFAULT 'UPI' NOT NULL,
	"invoice_reference" varchar(100),
	"receipt_storage_key" varchar(500),
	"description" text NOT NULL,
	"recorded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_expense_number_unique" UNIQUE("expense_number")
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"allocation_type" varchar(50) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_number" varchar(50) NOT NULL,
	"booking_id" uuid NOT NULL,
	"rider_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_type" "payment_type" NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"transaction_reference" varchar(150),
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"paid_at" timestamp with time zone,
	"recorded_by" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_payment_number_unique" UNIQUE("payment_number")
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"refund_number" varchar(50) NOT NULL,
	"payment_id" uuid,
	"booking_id" uuid NOT NULL,
	"rider_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"refund_reason" varchar(100) NOT NULL,
	"refund_method" "payment_method" NOT NULL,
	"transaction_reference" varchar(150),
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"processed_by" uuid,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_refund_number_unique" UNIQUE("refund_number")
);
--> statement-breakpoint
CREATE TABLE "accident_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_number" varchar(50) NOT NULL,
	"booking_id" uuid NOT NULL,
	"rider_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"incident_date" timestamp with time zone NOT NULL,
	"location" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"is_vehicle_drivable" boolean DEFAULT false NOT NULL,
	"third_party_involved" boolean DEFAULT false NOT NULL,
	"police_report_filed" boolean DEFAULT false NOT NULL,
	"fir_gd_number" varchar(100),
	"damage_assessment" text,
	"estimated_repair_cost" numeric(10, 2) DEFAULT '0.00',
	"actual_repair_cost" numeric(10, 2) DEFAULT '0.00',
	"rider_liability_amount" numeric(10, 2) DEFAULT '0.00',
	"incident_status" varchar(50) DEFAULT 'REPORTED' NOT NULL,
	"reported_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accident_incidents_incident_number_unique" UNIQUE("incident_number")
);
--> statement-breakpoint
CREATE TABLE "insurance_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"claim_number" varchar(100) NOT NULL,
	"insurer_name" varchar(150) NOT NULL,
	"policy_number" varchar(100) NOT NULL,
	"claim_amount" numeric(12, 2) NOT NULL,
	"approved_amount" numeric(12, 2),
	"claim_status" varchar(50) DEFAULT 'SUBMITTED' NOT NULL,
	"filed_date" date NOT NULL,
	"settled_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_claims_incident_id_unique" UNIQUE("incident_id"),
	CONSTRAINT "insurance_claims_claim_number_unique" UNIQUE("claim_number")
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"maintenance_number" varchar(50) NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"reported_by" uuid NOT NULL,
	"issue_category" "maintenance_category" NOT NULL,
	"description" text NOT NULL,
	"priority" varchar(20) DEFAULT 'MEDIUM' NOT NULL,
	"report_date" date DEFAULT now() NOT NULL,
	"odometer_reading" integer NOT NULL,
	"estimated_cost" numeric(10, 2) DEFAULT '0.00',
	"actual_cost" numeric(10, 2) DEFAULT '0.00',
	"service_provider" varchar(150),
	"repair_status" "maintenance_status" DEFAULT 'REPORTED' NOT NULL,
	"completion_date" date,
	"release_inspection_id" uuid,
	"admin_released_by" uuid,
	"admin_released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_records_maintenance_number_unique" UNIQUE("maintenance_number")
);
--> statement-breakpoint
CREATE TABLE "maintenance_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"maintenance_id" uuid NOT NULL,
	"notes" text NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_role" varchar(30) NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar(50) NOT NULL,
	"rider_id" uuid NOT NULL,
	"booking_id" uuid,
	"vehicle_id" uuid,
	"category" varchar(50) NOT NULL,
	"subject" varchar(200) NOT NULL,
	"priority" varchar(20) DEFAULT 'MEDIUM' NOT NULL,
	"status" varchar(30) DEFAULT 'OPEN' NOT NULL,
	"assigned_to" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_documents" ADD CONSTRAINT "rider_documents_rider_id_rider_profiles_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_documents" ADD CONSTRAINT "rider_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_profiles" ADD CONSTRAINT "rider_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_profiles" ADD CONSTRAINT "rider_profiles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_status_history" ADD CONSTRAINT "vehicle_status_history_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_status_history" ADD CONSTRAINT "vehicle_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_pricing" ADD CONSTRAINT "vehicle_pricing_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_pricing" ADD CONSTRAINT "vehicle_pricing_package_id_rental_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."rental_packages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_pricing" ADD CONSTRAINT "vehicle_pricing_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_extensions" ADD CONSTRAINT "booking_extensions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_extensions" ADD CONSTRAINT "booking_extensions_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_extensions" ADD CONSTRAINT "booking_extensions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_price_snapshots" ADD CONSTRAINT "booking_price_snapshots_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_price_snapshots" ADD CONSTRAINT "booking_price_snapshots_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_rider_id_rider_profiles_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_package_id_rental_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."rental_packages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_rider_id_rider_profiles_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_photos" ADD CONSTRAINT "inspection_photos_inspection_id_vehicle_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."vehicle_inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_transactions" ADD CONSTRAINT "deposit_transactions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_transactions" ADD CONSTRAINT "deposit_transactions_rider_id_rider_profiles_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_transactions" ADD CONSTRAINT "deposit_transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_transactions" ADD CONSTRAINT "deposit_transactions_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_rider_id_rider_profiles_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_rider_id_rider_profiles_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accident_incidents" ADD CONSTRAINT "accident_incidents_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accident_incidents" ADD CONSTRAINT "accident_incidents_rider_id_rider_profiles_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accident_incidents" ADD CONSTRAINT "accident_incidents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accident_incidents" ADD CONSTRAINT "accident_incidents_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_incident_id_accident_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."accident_incidents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_release_inspection_id_vehicle_inspections_id_fk" FOREIGN KEY ("release_inspection_id") REFERENCES "public"."vehicle_inspections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_admin_released_by_users_id_fk" FOREIGN KEY ("admin_released_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_updates" ADD CONSTRAINT "maintenance_updates_maintenance_id_maintenance_records_id_fk" FOREIGN KEY ("maintenance_id") REFERENCES "public"."maintenance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_updates" ADD CONSTRAINT "maintenance_updates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_message_id_support_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."support_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_rider_id_rider_profiles_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
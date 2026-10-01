CREATE TYPE "public"."habit_unit" AS ENUM('count', 'minutes', 'check');--> statement-breakpoint
CREATE TYPE "public"."quest_period" AS ENUM('week', 'month');--> statement-breakpoint
CREATE TABLE "habits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"unit" "habit_unit" NOT NULL,
	"default_target" integer NOT NULL,
	"color" text NOT NULL,
	"icon" text NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "habits_user_name_unique" UNIQUE("user_id","name"),
	CONSTRAINT "habits_default_target_positive" CHECK ("habits"."default_target" > 0)
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"habit_id" integer NOT NULL,
	"date" date NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "logs_habit_date_unique" UNIQUE("habit_id","date"),
	CONSTRAINT "logs_amount_nonnegative" CHECK ("logs"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quest_habits" (
	"id" serial PRIMARY KEY NOT NULL,
	"quest_id" integer NOT NULL,
	"habit_id" integer NOT NULL,
	"daily_target" integer NOT NULL,
	CONSTRAINT "quest_habits_quest_habit_unique" UNIQUE("quest_id","habit_id"),
	CONSTRAINT "quest_habits_target_positive" CHECK ("quest_habits"."daily_target" > 0)
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"period" "quest_period" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quests_dates_ordered" CHECK ("quests"."end_date" >= "quests"."start_date")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_habits" ADD CONSTRAINT "quest_habits_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_habits" ADD CONSTRAINT "quest_habits_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
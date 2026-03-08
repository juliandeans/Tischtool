ALTER TABLE "images" DROP CONSTRAINT "images_generation_id_generations_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_cover_image_id_images_id_fk";

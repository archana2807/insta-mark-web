-- CreateEnum
CREATE TYPE "CategoryGroup" AS ENUM ('ARCHITECTURAL', 'ROAD_SAFETY');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "category_group" "CategoryGroup" NOT NULL DEFAULT 'ARCHITECTURAL',
ADD COLUMN     "icon" VARCHAR(50);


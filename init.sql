CREATE DATABASE IF NOT EXISTS `recording_service`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `recording_service`;

CREATE TABLE IF NOT EXISTS `video_metadata` (
  `id` VARCHAR(36) NOT NULL,
  `RTSPURL` VARCHAR(255) NOT NULL,
  `sessionID` VARCHAR(255) NOT NULL,
  `segmentNumber` INT NOT NULL,
  `Bucket` VARCHAR(255) NOT NULL,
  `Key` VARCHAR(255) NOT NULL,
  `startedAt` BIGINT NOT NULL,
  `endedAt` BIGINT NOT NULL,
  `isEncoded` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`)
);
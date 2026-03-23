package com.example.video_metadata_service.repository;

import org.springframework.data.repository.CrudRepository;

import com.example.video_metadata_service.entity.Video;

public interface VideoRepository extends CrudRepository<Video, String> {
}

package com.example.video_metadata_service.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.video_metadata_service.dto.VideoRequest;
import com.example.video_metadata_service.entity.Video;
import com.example.video_metadata_service.repository.VideoRepository;

@Service
public class VideoService {
    private final VideoRepository repository;

    public VideoService(VideoRepository repository){
        this.repository=repository;
    }

    public Video createVideo(VideoRequest request){
        Video video = new Video(
            request.fileName(),
            request.fileDir(),
            false
        );
        return repository.save(video);
    }
    public Iterable<Video> getVideos(){
        return repository.findAll();
    }

    public Optional<Video> getVideo(String id){
        return repository.findById(id);
    }

    public boolean getEncodingStatus(String id){
        return repository.findById(id).map(Video::isEncoded).orElse(false);
    }

    public void deleteVideo(String id){
        repository.deleteById(id);
    }
}

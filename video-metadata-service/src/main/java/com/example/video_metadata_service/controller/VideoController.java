package com.example.video_metadata_service.controller;

import org.springframework.web.bind.annotation.RestController;

import com.example.video_metadata_service.dto.VideoRequest;
import com.example.video_metadata_service.entity.Video;
import com.example.video_metadata_service.service.VideoService;

import java.util.Optional;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/videos")

public class VideoController {

    private final VideoService videoService;

    public VideoController(VideoService videoService){
        this.videoService=videoService;
    }

    @PostMapping()
    public Video postVideo(@RequestBody VideoRequest request) {
        return this.videoService.createVideo(request);
    }

    @GetMapping()
    public Iterable<Video> getVideos() {
        return this.videoService.getVideos();
    }

    @GetMapping("/{uuid}")
    public Optional<Video> getVideo(@PathVariable String uuid) {
        return this.videoService.getVideo(uuid);
    }

    @GetMapping("/{uuid}/encoding-status")
    public boolean getEncodingStatus(@PathVariable String uuid) {

        return this.videoService.getEncodingStatus(uuid);
    }

    @DeleteMapping("/{uuid}")
    public void deleteVideo(@PathVariable String uuid) {
        this.videoService.deleteVideo(uuid);
    }    
     

}

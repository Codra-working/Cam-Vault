package com.example.video_metadata_service.dto;

public record VideoResponse(    
    String uuid,
    String fileName,
    String fileDir,
    boolean isEncoded) {
}

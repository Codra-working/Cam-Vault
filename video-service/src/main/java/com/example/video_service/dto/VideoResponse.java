package com.example.video_service.dto;

public record VideoResponse(    
    String uuid,
    String fileName,
    String fileDir,
    boolean isEncoded) {
}

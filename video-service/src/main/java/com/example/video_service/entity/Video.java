package com.example.video_service.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "video_metadata")
public class Video {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(name = "fileName", nullable = false)
    private String fileName;

    @Column(name = "fileDir", nullable = false)
    private String fileDir;

    @Column(name = "isEncoded", nullable = false)
    private boolean isEncoded;

    protected Video() {
    }

    public Video(String fileName, String fileDir, boolean isEncoded) {
        this.fileName = fileName;
        this.fileDir = fileDir;
        this.isEncoded = isEncoded;
    }

    @PrePersist
    void ensureId() {
        if (id == null || id.isBlank()) {
            id = UUID.randomUUID().toString();
        }
    }

    public String getId() {
        return id;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFileDir() {
        return fileDir;
    }

    public boolean isEncoded() {
        return isEncoded;
    }

    public void setEncoded(boolean encoded) {
        isEncoded = encoded;
    }
}

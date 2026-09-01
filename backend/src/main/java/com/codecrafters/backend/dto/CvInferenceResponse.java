package com.codecrafters.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.OffsetDateTime;

public class CvInferenceResponse {

    @JsonProperty("zone_id")
    private String zoneId;

    @JsonProperty("timestamp")
    private OffsetDateTime timestamp;

    @JsonProperty("crack_detected")
    private boolean crackDetected;

    @JsonProperty("crack_severity")
    private String crackSeverity;

    @JsonProperty("deformation_mm")
    private Double deformationMm;

    @JsonProperty("crack_confidence")
    private Double crackConfidence;

    public CvInferenceResponse() {
    }

    public String getZoneId() {
        return zoneId;
    }

    public void setZoneId(String zoneId) {
        this.zoneId = zoneId;
    }

    public OffsetDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(OffsetDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public boolean isCrackDetected() {
        return crackDetected;
    }

    public void setCrackDetected(boolean crackDetected) {
        this.crackDetected = crackDetected;
    }

    public String getCrackSeverity() {
        return crackSeverity;
    }

    public void setCrackSeverity(String crackSeverity) {
        this.crackSeverity = crackSeverity;
    }

    public Double getDeformationMm() {
        return deformationMm;
    }

    public void setDeformationMm(Double deformationMm) {
        this.deformationMm = deformationMm;
    }

    public Double getCrackConfidence() {
        return crackConfidence;
    }

    public void setCrackConfidence(Double crackConfidence) {
        this.crackConfidence = crackConfidence;
    }
}
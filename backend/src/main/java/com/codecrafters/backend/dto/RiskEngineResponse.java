package com.codecrafters.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RiskEngineResponse {

    @JsonProperty("risk_class")
    private Integer riskClass;

    @JsonProperty("risk_level")
    private String riskLevel;

    private Double confidence;

    public RiskEngineResponse() {
    }

    public Integer getRiskClass() {
        return riskClass;
    }

    public void setRiskClass(Integer riskClass) {
        this.riskClass = riskClass;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
}
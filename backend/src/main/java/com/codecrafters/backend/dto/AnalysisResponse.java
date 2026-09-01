package com.codecrafters.backend.dto;

public class AnalysisResponse {

    private CvInferenceResponse cvResult;
    private RiskEngineResponse riskResult;

    public AnalysisResponse() {
    }

    public AnalysisResponse(
            CvInferenceResponse cvResult,
            RiskEngineResponse riskResult) {

        this.cvResult = cvResult;
        this.riskResult = riskResult;
    }

    public CvInferenceResponse getCvResult() {
        return cvResult;
    }

    public void setCvResult(CvInferenceResponse cvResult) {
        this.cvResult = cvResult;
    }

    public RiskEngineResponse getRiskResult() {
        return riskResult;
    }

    public void setRiskResult(RiskEngineResponse riskResult) {
        this.riskResult = riskResult;
    }
}
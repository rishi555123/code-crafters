package com.codecrafters.backend.controller;

import com.codecrafters.backend.dto.AnalysisResponse;
import com.codecrafters.backend.dto.RiskEngineResponse;
import com.codecrafters.backend.service.AnalysisService;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping(
            value = "/cv",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public AnalysisResponse analyze(
            @RequestParam("image") MultipartFile image,
            @RequestParam("zone_id") String zoneId
    ) throws IOException {

        return analysisService.analyze(image, zoneId);
    }

    @GetMapping("/risk/{zoneId}")
    public RiskEngineResponse analyzeRisk(
            @PathVariable String zoneId
    ) {
        return analysisService.analyzeRisk(zoneId);
    }
}
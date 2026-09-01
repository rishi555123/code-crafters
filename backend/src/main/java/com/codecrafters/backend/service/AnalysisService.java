package com.codecrafters.backend.service;

import com.codecrafters.backend.client.CvClient;
import com.codecrafters.backend.client.RiskEngineClient;
import com.codecrafters.backend.dto.AnalysisResponse;
import com.codecrafters.backend.dto.CvInferenceResponse;
import com.codecrafters.backend.dto.RiskEngineRequest;
import com.codecrafters.backend.dto.RiskEngineResponse;
import com.codecrafters.backend.entity.Zone;
import com.codecrafters.backend.repository.ZoneRepository;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

// import com.codecrafters.backend.dto.RiskEngineRequest;
// import com.codecrafters.backend.dto.RiskEngineResponse;

@Service
public class AnalysisService {

    private final CvClient cvClient;
    private final RiskEngineClient riskEngineClient;
    private final ZoneRepository zoneRepository;

    public AnalysisService(
            CvClient cvClient,
            RiskEngineClient riskEngineClient,
            ZoneRepository zoneRepository) {

        this.cvClient = cvClient;
        this.riskEngineClient = riskEngineClient;
        this.zoneRepository = zoneRepository;
    }

    // public CvInferenceResponse analyze(MultipartFile image, String zoneId)
    //         throws IOException {

    //     Zone zone = zoneRepository.findByZoneId(zoneId)
    //             .orElseThrow(() -> new RuntimeException(
    //                     "Zone not found: " + zoneId
    //             ));

    //     RiskEngineRequest riskRequest = new RiskEngineRequest();

    //     riskRequest.setP16(zone.getP16());
    //     riskRequest.setP5(zone.getP5());
    //     riskRequest.setP17(zone.getP17());
    //     riskRequest.setP2(zone.getP2());
    //     riskRequest.setP1(zone.getP1());

    //     RiskEngineResponse riskResponse =
    //             riskEngineClient.analyze(riskRequest);

    //     return cvClient.analyze(image, zoneId);
    // }

    public AnalysisResponse analyze(MultipartFile image, String zoneId)
        throws IOException {

    Zone zone = zoneRepository.findByZoneId(zoneId)
            .orElseThrow(() -> new RuntimeException(
                    "Zone not found: " + zoneId
            ));

    RiskEngineRequest riskRequest = new RiskEngineRequest();

    riskRequest.setP16(zone.getP16());
    riskRequest.setP5(zone.getP5());
    riskRequest.setP17(zone.getP17());
    riskRequest.setP2(zone.getP2());
    riskRequest.setP1(zone.getP1());

    RiskEngineResponse riskResponse =
            riskEngineClient.analyze(riskRequest);

    CvInferenceResponse cvResponse =
            cvClient.analyze(image, zoneId);

    return new AnalysisResponse(cvResponse, riskResponse);
}

public RiskEngineResponse analyzeRisk(String zoneId) {

    Zone zone = zoneRepository.findByZoneId(zoneId)
            .orElseThrow(() -> new RuntimeException(
                    "Zone not found: " + zoneId
            ));

    RiskEngineRequest riskRequest = new RiskEngineRequest();

    riskRequest.setP16(zone.getP16());
    riskRequest.setP5(zone.getP5());
    riskRequest.setP17(zone.getP17());
    riskRequest.setP2(zone.getP2());
    riskRequest.setP1(zone.getP1());

    return riskEngineClient.analyze(riskRequest);
}

}
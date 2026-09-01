package com.codecrafters.backend.client;

import com.codecrafters.backend.dto.RiskEngineRequest;
import com.codecrafters.backend.dto.RiskEngineResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class RiskEngineClient {

    private final RestClient restClient;

    public RiskEngineClient(
            RestClient.Builder restClientBuilder,
            @Value("${risk-engine.service.base-url}") String riskEngineBaseUrl) {

        this.restClient = restClientBuilder
                .baseUrl(riskEngineBaseUrl)
                .build();
    }

    public RiskEngineResponse analyze(RiskEngineRequest request) {

        return restClient.post()
                .uri("/risk/analyze")
                .body(request)
                .retrieve()
                .body(RiskEngineResponse.class);
    }
}
package com.codecrafters.backend.client;

import com.codecrafters.backend.dto.CvInferenceResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Component
public class CvClient {

    private final RestClient restClient;

    public CvClient(
            RestClient.Builder restClientBuilder,
            @Value("${cv.service.base-url}") String cvBaseUrl) {

        this.restClient = restClientBuilder
                .baseUrl(cvBaseUrl)
                .build();
    }

    public CvInferenceResponse analyze(MultipartFile image, String zoneId) throws IOException {

        ByteArrayResource imageResource = new ByteArrayResource(image.getBytes()) {
            @Override
            public String getFilename() {
                return image.getOriginalFilename();
            }
        };

        return restClient.post()
                .uri("/cv/analyze")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(
                        new org.springframework.util.LinkedMultiValueMap<String, Object>() {{
                            add("image", imageResource);
                            add("zone_id", zoneId);
                        }}
                )
                .retrieve()
                .body(CvInferenceResponse.class);
    }
}

/*
✅ CvInferenceResponse
        ↓
✅ CvClient
        ↓
✅ Configure CV base URL       ← NOW
        ↓
⏭️ Add analyze() method
        ↓
⏭️ Send image + zone_id
        ↓
⏭️ Receive CV respons */
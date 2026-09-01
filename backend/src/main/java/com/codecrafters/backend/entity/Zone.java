package com.codecrafters.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "zones")
public class Zone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String zoneId;

    @Column(nullable = false)
    private Double p1;

    @Column(nullable = false)
    private Double p2;

    @Column(nullable = false)
    private Double p5;

    @Column(nullable = false)
    private Double p16;

    @Column(nullable = false)
    private Double p17;

    public Zone() {
    }

    public Long getId() {
        return id;
    }

    public String getZoneId() {
        return zoneId;
    }

    public void setZoneId(String zoneId) {
        this.zoneId = zoneId;
    }

    public Double getP1() {
        return p1;
    }

    public void setP1(Double p1) {
        this.p1 = p1;
    }

    public Double getP2() {
        return p2;
    }

    public void setP2(Double p2) {
        this.p2 = p2;
    }

    public Double getP5() {
        return p5;
    }

    public void setP5(Double p5) {
        this.p5 = p5;
    }

    public Double getP16() {
        return p16;
    }

    public void setP16(Double p16) {
        this.p16 = p16;
    }

    public Double getP17() {
        return p17;
    }

    public void setP17(Double p17) {
        this.p17 = p17;
    }
}
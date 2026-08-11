package com.etayo.backend.model;

import jakarta.persistence.Embeddable;

@Embeddable
public class LocationCoordinates {
    private Double lat;
    private Double lng;
    private String address;
    private String lotNo;
    private String blockNo;

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }
    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getLotNo() { return lotNo; }
    public void setLotNo(String lotNo) { this.lotNo = lotNo; }
    public String getBlockNo() { return blockNo; }
    public void setBlockNo(String blockNo) { this.blockNo = blockNo; }
}

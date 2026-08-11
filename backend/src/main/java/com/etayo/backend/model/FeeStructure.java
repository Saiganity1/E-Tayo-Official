package com.etayo.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "fee_structures")
public class FeeStructure {

    @Id
    private String id;
    
    private String name;
    private double baseAmount;
    private String multiplierName;
    private Double multiplierValue;
    private String category;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public double getBaseAmount() { return baseAmount; }
    public void setBaseAmount(double baseAmount) { this.baseAmount = baseAmount; }
    public String getMultiplierName() { return multiplierName; }
    public void setMultiplierName(String multiplierName) { this.multiplierName = multiplierName; }
    public Double getMultiplierValue() { return multiplierValue; }
    public void setMultiplierValue(Double multiplierValue) { this.multiplierValue = multiplierValue; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}

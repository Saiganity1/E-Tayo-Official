package com.etayo.backend.repository;

import com.etayo.backend.model.PermitApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PermitApplicationRepository extends JpaRepository<PermitApplication, String> {
    List<PermitApplication> findByApplicantName(String applicantName);
}

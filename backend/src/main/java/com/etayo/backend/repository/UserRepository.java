package com.etayo.backend.repository;

import com.etayo.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(:email)) ORDER BY u.id DESC")
    List<User> findAllByEmailIgnoreCase(@Param("email") String email);

    default Optional<User> findByEmailIgnoreCase(String email) {
        if (email == null) return Optional.empty();
        List<User> list = findAllByEmailIgnoreCase(email.trim());
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(:email))")
    Boolean existsByEmailIgnoreCase(@Param("email") String email);

    Boolean existsByEmail(String email);
}

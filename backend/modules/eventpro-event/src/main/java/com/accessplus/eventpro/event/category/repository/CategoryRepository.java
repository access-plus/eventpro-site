package com.accessplus.eventpro.event.category.repository;

import com.accessplus.eventpro.event.category.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for CategoryEntity.
 * Provides standard CRUD operations and custom query methods.
 */
@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, UUID> {

    /**
     * Finds a category by its name.
     * 
     * @param name the category name
     * @return Optional containing the category if found, empty otherwise
     */
    Optional<CategoryEntity> findByName(String name);

    /**
     * Checks if a category exists with the given name.
     * 
     * @param name the category name
     * @return true if a category with this name exists, false otherwise
     */
    boolean existsByName(String name);
}


package com.nexus.identityservice.repository;


import com.nexus.identityservice.model.Broker;
import org.springframework.stereotype.Repository;

@Repository
public interface BrokerRepository extends UserRepository<Broker> {

}

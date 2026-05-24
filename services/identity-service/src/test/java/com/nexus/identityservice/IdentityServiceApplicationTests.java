package com.nexus.identityservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:identitydb;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
		"jwt.secret=local-test-jwt-secret-with-at-least-32-bytes",
		"jwt.expiration=86400000",
		"jwt.refresh-expiration=86400000",
		"stripe.secret-key=sk_test_dummy",
		"stripe.monthly-price-id=price_monthly_dummy",
		"stripe.yearly-price-id=price_yearly_dummy",
		"frontend-domain=http://localhost:8100",
		"notification-service-url=http://localhost:8080"
})
@ActiveProfiles("test")
class IdentityServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}

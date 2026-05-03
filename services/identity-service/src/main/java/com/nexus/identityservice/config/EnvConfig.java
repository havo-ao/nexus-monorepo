package com.nexus.identityservice.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.PropertySourcesPlaceholderConfigurer;

import java.util.Properties;

@Configuration
public class EnvConfig {
    /**
     * Logger to record messages during data loading.
     */
    private static final Logger log = LoggerFactory.getLogger(EnvConfig.class);

    @Bean
    public static PropertySourcesPlaceholderConfigurer propertySourcesPlaceholderConfigurer() {
        PropertySourcesPlaceholderConfigurer configurer = new PropertySourcesPlaceholderConfigurer();

        try {
            // Cargar .env manualmente
            Dotenv dotenv = Dotenv.load();
            Properties properties = new Properties();

            dotenv.entries().forEach(entry -> {
                properties.setProperty(entry.getKey(), entry.getValue());
            });

            configurer.setProperties(properties);
        } catch (Exception e) {
            log.info("An error occur loading .env variables");
        }

        return configurer;
    }
}

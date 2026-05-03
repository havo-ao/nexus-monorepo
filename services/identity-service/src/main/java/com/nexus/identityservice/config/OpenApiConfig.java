package com.nexus.identityservice.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.examples.Example;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.responses.ApiResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI (Swagger) configuration for REST API documentation. This class defines the
 * general API information, security schemes, and reusable components for documentation.
 */
@Configuration
public class OpenApiConfig {
    // Configuration class for OpenAPI documentation

    /**
     * Defines reusable components for OpenAPI documentation. Includes common response examples
     * to improve documentation.
     *
     * @return Custom OpenAPI configuration
     */
    @Bean
    public OpenAPI customOpenAPI() {
        // Create the main description with correctly formatted HTML
        String mainDescription =
                "<h2>Use guide for nexus API </h2>";

        // Create the security scheme description with correctly formatted HTML
        String securityDescription =
                "Authentication via JWT (JSON Web Token)."
                        + "<p>To authenticate, follow these steps:</p>"
                        + "<ol>"
                        + "    <li>Obtain a JWT token using the <code>/auth/login</code> endpoint</li>"
                        + "    <li>Copy the token received in the response</li>"
                        + "    <li>Click the \"Authorize\" button at the top of this page</li>"
                        + "    <li>In the \"Value\" field, type: <code>Bearer your_jwt_token</code></li>"
                        + "    <li>Click \"Authorize\" and then \"Close\"</li>"
                        + "</ol>"
                        + "<p>Now you can access the protected endpoints.</p>";

        // Create Info object with HTML description
        io.swagger.v3.oas.models.info.Info info =
                new io.swagger.v3.oas.models.info.Info()
                        .title("API identity service NEXUS")
                        .version("1.0")
                        .description(mainDescription)
                        .contact(
                                new io.swagger.v3.oas.models.info.Contact()
                                        .name("Nexus Company")
                                        .email("dsramireza@unbosque.edu.co")
                                        .url("https://github.com/Nexus-Trading/nexus-monorepo"));

        // Create the security scheme
        io.swagger.v3.oas.models.security.SecurityScheme securityScheme =
                new io.swagger.v3.oas.models.security.SecurityScheme()
                        .type(io.swagger.v3.oas.models.security.SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description(securityDescription);

        return new OpenAPI()
                .info(info)
                .addSecurityItem(new io.swagger.v3.oas.models.security.SecurityRequirement().addList("bearerAuth"))
                .components(
                        new Components()
                                .addSecuritySchemes("bearerAuth", securityScheme)

                                .addResponses(
                                        "UnauthorizedError",
                                        new ApiResponse()
                                                .description("Not authenticated - Invalid or expired JWT token")
                                                .content(
                                                        new Content()
                                                                .addMediaType(
                                                                        "application/json",
                                                                        new MediaType()
                                                                                .addExamples(
                                                                                        "error",
                                                                                        new Example()
                                                                                                .value(
                                                                                                        "{\"error\": \"Unauthorized\", \"message\":"
                                                                                                                + " \"Invalid or expired token\"}")))))
                                .addResponses(
                                        "ForbiddenError",
                                        new ApiResponse()
                                                .description("Forbidden access - You do not have sufficient permissions")
                                                .content(
                                                        new Content()
                                                                .addMediaType(
                                                                        "application/json",
                                                                        new MediaType()
                                                                                .addExamples(
                                                                                        "error",
                                                                                        new Example()
                                                                                                .value(
                                                                                                        "{\"error\": \"Forbidden access\", \"message\":"
                                                                                                                + " \"You do not have permissions for this"
                                                                                                                + " operation\"}")))))
                                .addResponses(
                                        "NotFoundError",
                                        new ApiResponse()
                                                .description("Resource not found")
                                                .content(
                                                        new Content()
                                                                .addMediaType(
                                                                        "application/json",
                                                                        new MediaType()
                                                                                .addExamples(
                                                                                        "error",
                                                                                        new Example()
                                                                                                .value(
                                                                                                        "{\"error\": \"Not found\", \"message\":"
                                                                                                                + " \"The requested resource does not"
                                                                                                                + " exist\"}"))))));
    }
}

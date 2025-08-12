-- Populate AZ-204 Exam Modules and Sections
-- Based on official Microsoft study guide: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-204
-- Main modules are the specific skill areas, sub-modules are the detailed tasks

-- Insert main modules (specific skill areas)
INSERT INTO modules (title, "order", description, sort_order) VALUES
('Implement containerized solutions', 1, 'Create and manage container images, Azure Container Registry, Container Instance, and Container Apps', 1),
('Implement Azure App Service Web Apps', 2, 'Create, configure, deploy and scale Azure App Service Web Apps', 2),
('Implement Azure Functions', 3, 'Create, configure Function Apps, bindings, triggers, and Durable Functions', 3),
('Develop solutions that use Azure Cosmos DB', 4, 'Operations on data, consistency levels, and change feed notifications', 4),
('Develop solutions that use Azure Blob Storage', 5, 'Properties, metadata, SDK operations, storage policies and archiving', 5),
('Implement user authentication and authorization', 6, 'Microsoft identity platform, Entra ID, SAS, and Microsoft Graph', 6),
('Implement secure Azure solutions', 7, 'App Configuration, Key Vault, keys, secrets, certificates, and Managed Identities', 7),
('Integrate caching and content delivery within solutions', 8, 'Azure Cache for Redis, cache patterns, and Content Delivery Network', 8),
('Instrument solutions to support monitoring and logging', 9, 'Application Insights configuration, metrics, logs, traces, and alerts', 9),
('Implement API Management', 10, 'APIM instances, authentication, and policies for APIs', 10),
('Develop event-based solutions', 11, 'Azure Event Grid and Azure Event Hub implementations', 11),
('Develop message-based solutions', 12, 'Azure Service Bus and Azure Queue Storage queues', 12);

-- Insert module sections (detailed tasks/sub-modules) using a function to handle the foreign key relationships
DO $$
DECLARE
    module_containerized_id uuid;
    module_appservice_id uuid;
    module_functions_id uuid;
    module_cosmosdb_id uuid;
    module_blobstorage_id uuid;
    module_auth_id uuid;
    module_security_id uuid;
    module_caching_id uuid;
    module_monitoring_id uuid;
    module_apim_id uuid;
    module_events_id uuid;
    module_messages_id uuid;
BEGIN
    -- Get module IDs
    SELECT id INTO module_containerized_id FROM modules WHERE title = 'Implement containerized solutions';
    SELECT id INTO module_appservice_id FROM modules WHERE title = 'Implement Azure App Service Web Apps';
    SELECT id INTO module_functions_id FROM modules WHERE title = 'Implement Azure Functions';
    SELECT id INTO module_cosmosdb_id FROM modules WHERE title = 'Develop solutions that use Azure Cosmos DB';
    SELECT id INTO module_blobstorage_id FROM modules WHERE title = 'Develop solutions that use Azure Blob Storage';
    SELECT id INTO module_auth_id FROM modules WHERE title = 'Implement user authentication and authorization';
    SELECT id INTO module_security_id FROM modules WHERE title = 'Implement secure Azure solutions';
    SELECT id INTO module_caching_id FROM modules WHERE title = 'Integrate caching and content delivery within solutions';
    SELECT id INTO module_monitoring_id FROM modules WHERE title = 'Instrument solutions to support monitoring and logging';
    SELECT id INTO module_apim_id FROM modules WHERE title = 'Implement API Management';
    SELECT id INTO module_events_id FROM modules WHERE title = 'Develop event-based solutions';
    SELECT id INTO module_messages_id FROM modules WHERE title = 'Develop message-based solutions';

    -- Insert sections for Module 1: Implement containerized solutions
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_containerized_id, 'Create and manage container images for solutions', 1, 1),
    (module_containerized_id, 'Publish an image to Azure Container Registry', 2, 2),
    (module_containerized_id, 'Run containers by using Azure Container Instance', 3, 3),
    (module_containerized_id, 'Create solutions by using Azure Container Apps', 4, 4);

    -- Insert sections for Module 2: Implement Azure App Service Web Apps
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_appservice_id, 'Create an Azure App Service Web App', 1, 5),
    (module_appservice_id, 'Enable diagnostics logging', 2, 6),
    (module_appservice_id, 'Deploy code to a web app', 3, 7),
    (module_appservice_id, 'Configure web app settings including SSL, API settings, and connection strings', 4, 8),
    (module_appservice_id, 'Implement autoscaling rules including scheduled autoscaling and autoscaling by operational or system metrics', 5, 9);

    -- Insert sections for Module 3: Implement Azure Functions
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_functions_id, 'Create and configure an Azure Function App', 1, 10),
    (module_functions_id, 'Implement input and output bindings', 2, 11),
    (module_functions_id, 'Implement function triggers by using data operations, timers, and webhooks', 3, 12),
    (module_functions_id, 'Implement Azure Durable Functions', 4, 13);

    -- Insert sections for Module 4: Develop solutions that use Azure Cosmos DB
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_cosmosdb_id, 'Perform operations on data and Cosmos DB containers', 1, 14),
    (module_cosmosdb_id, 'Set the appropriate consistency level for operations', 2, 15),
    (module_cosmosdb_id, 'Implement change feed notifications', 3, 16);

    -- Insert sections for Module 5: Develop solutions that use Azure Blob Storage
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_blobstorage_id, 'Set and retrieve properties and metadata', 1, 17),
    (module_blobstorage_id, 'Perform operations on data by using the appropriate SDK', 2, 18),
    (module_blobstorage_id, 'Implement storage policies and data archiving and retention', 3, 19);

    -- Insert sections for Module 6: Implement user authentication and authorization
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_auth_id, 'Authenticate and authorize users by using the Microsoft identity platform', 1, 20),
    (module_auth_id, 'Authenticate and authorize users and apps by using Microsoft Entra ID', 2, 21),
    (module_auth_id, 'Create and implement shared access signatures', 3, 22),
    (module_auth_id, 'Implement solutions that interact with Microsoft Graph', 4, 23);

    -- Insert sections for Module 7: Implement secure Azure solutions
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_security_id, 'Secure app configuration data by using App Configuration or Azure Key Vault', 1, 24),
    (module_security_id, 'Develop code that uses keys, secrets, and certificates stored in Azure Key Vault', 2, 25),
    (module_security_id, 'Implement Managed Identities for Azure resources', 3, 26);

    -- Insert sections for Module 8: Integrate caching and content delivery within solutions
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_caching_id, 'Configure cache and expiration policies for Azure Cache for Redis', 1, 27),
    (module_caching_id, 'Implement secure and optimized application cache patterns including data sizing, connections, encryption, and expiration', 2, 28),
    (module_caching_id, 'Implement Azure Content Delivery Network endpoints and profiles', 3, 29);

    -- Insert sections for Module 9: Instrument solutions to support monitoring and logging
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_monitoring_id, 'Configure an app or service to use Application Insights', 1, 30),
    (module_monitoring_id, 'Monitor and analyze metrics, logs, and traces', 2, 31),
    (module_monitoring_id, 'Implement Application Insights web tests and alerts', 3, 32);

    -- Insert sections for Module 10: Implement API Management
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_apim_id, 'Create an APIM instance', 1, 33),
    (module_apim_id, 'Configure authentication for APIs', 2, 34),
    (module_apim_id, 'Define policies for APIs', 3, 35);

    -- Insert sections for Module 11: Develop event-based solutions
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_events_id, 'Implement solutions that use Azure Event Grid', 1, 36),
    (module_events_id, 'Implement solutions that use Azure Event Hub', 2, 37);

    -- Insert sections for Module 12: Develop message-based solutions
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_messages_id, 'Implement solutions that use Azure Service Bus', 1, 38),
    (module_messages_id, 'Implement solutions that use Azure Queue Storage queues', 2, 39);
END $$;

-- Verify the data was inserted correctly
SELECT 
    m.title as module_title,
    m.description,
    COUNT(ms.id) as section_count
FROM modules m
LEFT JOIN module_sections ms ON m.id = ms.module_id
GROUP BY m.id, m.title, m.description, m.sort_order
ORDER BY m.sort_order;

-- Show detailed breakdown
SELECT 
    m.title as module_title,
    ms.title as section_title,
    ms.sort_order
FROM modules m
JOIN module_sections ms ON m.id = ms.module_id
ORDER BY m.sort_order, ms.sort_order;

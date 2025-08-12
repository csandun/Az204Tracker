-- Add "Module Labs" sections to all main modules
-- This adds practical lab exercises as sub-modules for each AZ-204 exam module

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

    -- Add "Module Labs" section to each module
    INSERT INTO module_sections (module_id, title, "order", sort_order) VALUES
    (module_containerized_id, 'Module Labs', 5, 40),
    (module_appservice_id, 'Module Labs', 6, 41),
    (module_functions_id, 'Module Labs', 5, 42),
    (module_cosmosdb_id, 'Module Labs', 4, 43),
    (module_blobstorage_id, 'Module Labs', 4, 44),
    (module_auth_id, 'Module Labs', 5, 45),
    (module_security_id, 'Module Labs', 4, 46),
    (module_caching_id, 'Module Labs', 4, 47),
    (module_monitoring_id, 'Module Labs', 4, 48),
    (module_apim_id, 'Module Labs', 4, 49),
    (module_events_id, 'Module Labs', 3, 50),
    (module_messages_id, 'Module Labs', 3, 51);
END $$;

-- Verify the Module Labs sections were added
SELECT 
    m.title as module_title,
    ms.title as section_title,
    ms."order" as section_order,
    ms.sort_order
FROM modules m
JOIN module_sections ms ON m.id = ms.module_id
WHERE ms.title = 'Module Labs'
ORDER BY m.sort_order;
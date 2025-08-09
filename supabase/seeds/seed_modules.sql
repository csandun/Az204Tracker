-- Full seed for modules, sections, resources and optional demo user data
-- Idempotent: uses WHERE NOT EXISTS checks and stable titles/urls

BEGIN;

-- Safety backfill for legacy rows with NULL sort_order
UPDATE public.modules SET sort_order = COALESCE(sort_order, "order") WHERE sort_order IS NULL;
UPDATE public.module_sections SET sort_order = COALESCE(sort_order, "order") WHERE sort_order IS NULL;

-- ========== Modules (Weeks 1-10) ==========
-- Each INSERT guarded by NOT EXISTS so re-running is safe
INSERT INTO public.modules (title, "order", sort_order, description)
SELECT 'Week 1: Develop Azure Compute Solutions (VMs, VMSS, App Service)', 1, 1,
			 'Azure VMs, Virtual Machine Scale Sets, and App Service basics'
WHERE NOT EXISTS (
	SELECT 1 FROM public.modules WHERE title = 'Week 1: Develop Azure Compute Solutions (VMs, VMSS, App Service)'
);

INSERT INTO public.modules (title, "order", sort_order, description)
SELECT 'Week 2: Develop Azure Compute Solutions (Functions & Containers)', 2, 2,
			 'Azure Functions, Container Apps/AKS, and HTTP-triggered workloads'
WHERE NOT EXISTS (
	SELECT 1 FROM public.modules WHERE title = 'Week 2: Develop Azure Compute Solutions (Functions & Containers)'
);

INSERT INTO public.modules (title, "order", sort_order, description)
SELECT 'Week 3: Develop for Azure Storage (Blob & Cosmos DB)', 3, 3,
			 'Blob Storage CRUD and Cosmos DB (SDK queries, RU/s, models)'
WHERE NOT EXISTS (
	SELECT 1 FROM public.modules WHERE title = 'Week 3: Develop for Azure Storage (Blob & Cosmos DB)'
);

INSERT INTO public.modules (title, "order", sort_order, description)
SELECT 'Week 4: Develop for Azure Storage (Azure SQL Database)', 4, 4,
			 'Azure SQL development, CRUD APIs, secure connection strings'
WHERE NOT EXISTS (
	SELECT 1 FROM public.modules WHERE title = 'Week 4: Develop for Azure Storage (Azure SQL Database)'
);

INSERT INTO public.modules (title, "order", sort_order, description)
SELECT 'Week 5: Implement Azure Security (AuthN, RBAC, Managed Identity)', 5, 5,
			 'Authentication, RBAC, Managed Identities, secure access patterns'
WHERE NOT EXISTS (
	SELECT 1 FROM public.modules WHERE title = 'Week 5: Implement Azure Security (AuthN, RBAC, Managed Identity)'
);

INSERT INTO public.modules (title, "order", sort_order, description)
SELECT 'Week 6: Implement Azure Security (Key Vault & App Config)', 6, 6,
			 'Key Vault secrets, App Configuration feature flags, secure retrieval'
WHERE NOT EXISTS (
	SELECT 1 FROM public.modules WHERE title = 'Week 6: Implement Azure Security (Key Vault & App Config)'
);

INSERT INTO public.modules (title, "order", sort_order, description)
SELECT 'Week 7: Monitor & Optimize (App Insights, Redis Cache)', 7, 7,
			 'Application Insights telemetry + KQL, caching with Azure Cache for Redis'
WHERE NOT EXISTS (
	SELECT 1 FROM public.modules WHERE title = 'Week 7: Monitor & Optimize (App Insights, Redis Cache)'
);

INSERT INTO public.modules (title, "order", sort_order, description)
SELECT 'Week 8: API Integration (API Management & consume APIs)', 8, 8,
			 'API Management gateways, policies (rate-limiting), consuming external APIs'
WHERE NOT EXISTS (
	SELECT 1 FROM public.modules WHERE title = 'Week 8: API Integration (API Management & consume APIs)'
);

INSERT INTO public.modules (title, "order", sort_order, description)
SELECT 'Week 9: Event Solutions (Event Grid, Event Hubs, Service Bus)', 9, 9,
			 'Event-driven architectures with Event Grid, Event Hubs, Service Bus'
WHERE NOT EXISTS (
	SELECT 1 FROM public.modules WHERE title = 'Week 9: Event Solutions (Event Grid, Event Hubs, Service Bus)'
);

INSERT INTO public.modules (title, "order", sort_order, description)
SELECT 'Week 10: Message Solutions & API Security (Service Bus, OAuth2/OpenID)', 10, 10,
			 'Service Bus topics/subscriptions, OAuth2/OpenID Connect, JWT protection'
WHERE NOT EXISTS (
	SELECT 1 FROM public.modules WHERE title = 'Week 10: Message Solutions & API Security (Service Bus, OAuth2/OpenID)'
);

-- ========== Sections per module ==========
-- Helper CTEs to fetch module IDs by title once
WITH m AS (
	SELECT id, title FROM public.modules WHERE title IN (
		'Week 1: Develop Azure Compute Solutions (VMs, VMSS, App Service)',
		'Week 2: Develop Azure Compute Solutions (Functions & Containers)',
		'Week 3: Develop for Azure Storage (Blob & Cosmos DB)',
		'Week 4: Develop for Azure Storage (Azure SQL Database)',
		'Week 5: Implement Azure Security (AuthN, RBAC, Managed Identity)',
		'Week 6: Implement Azure Security (Key Vault & App Config)',
		'Week 7: Monitor & Optimize (App Insights, Redis Cache)',
		'Week 8: API Integration (API Management & consume APIs)',
		'Week 9: Event Solutions (Event Grid, Event Hubs, Service Bus)',
		'Week 10: Message Solutions & API Security (Service Bus, OAuth2/OpenID)'
	)
)
-- Week 1 sections
INSERT INTO public.module_sections (module_id, title, "order", sort_order)
SELECT (SELECT id FROM m WHERE title = 'Week 1: Develop Azure Compute Solutions (VMs, VMSS, App Service)'),
			 s.title, s.ord, s.ord
FROM (VALUES
	('Azure VMs', 1),
	('VM Scale Sets', 2),
	('App Service', 3)
) AS s(title, ord)
WHERE NOT EXISTS (
	SELECT 1 FROM public.module_sections ms
	WHERE ms.module_id = (SELECT id FROM m WHERE title = 'Week 1: Develop Azure Compute Solutions (VMs, VMSS, App Service)')
		AND ms.title = s.title
);

-- Week 2 sections
WITH m AS (
	SELECT id FROM public.modules WHERE title = 'Week 2: Develop Azure Compute Solutions (Functions & Containers)'
)
INSERT INTO public.module_sections (module_id, title, "order", sort_order)
SELECT (SELECT id FROM m), s.title, s.ord, s.ord
FROM (VALUES
	('Azure Functions', 1),
	('Container Apps/AKS', 2),
	('HTTP triggers & bindings', 3)
) AS s(title, ord)
WHERE NOT EXISTS (
	SELECT 1 FROM public.module_sections ms WHERE ms.module_id = (SELECT id FROM m) AND ms.title = s.title
);

-- Week 3 sections
WITH m AS (
	SELECT id FROM public.modules WHERE title = 'Week 3: Develop for Azure Storage (Blob & Cosmos DB)'
)
INSERT INTO public.module_sections (module_id, title, "order", sort_order)
SELECT (SELECT id FROM m), s.title, s.ord, s.ord
FROM (VALUES
	('Blob Storage CRUD', 1),
	('Cosmos DB modeling & queries', 2)
) AS s(title, ord)
WHERE NOT EXISTS (
	SELECT 1 FROM public.module_sections ms WHERE ms.module_id = (SELECT id FROM m) AND ms.title = s.title
);

-- Week 4 sections
WITH m AS (
	SELECT id FROM public.modules WHERE title = 'Week 4: Develop for Azure Storage (Azure SQL Database)'
)
INSERT INTO public.module_sections (module_id, title, "order", sort_order)
SELECT (SELECT id FROM m), s.title, s.ord, s.ord
FROM (VALUES
	('Azure SQL CRUD API', 1),
	('Secure connection strings', 2)
) AS s(title, ord)
WHERE NOT EXISTS (
	SELECT 1 FROM public.module_sections ms WHERE ms.module_id = (SELECT id FROM m) AND ms.title = s.title
);

-- Week 5 sections
WITH m AS (
	SELECT id FROM public.modules WHERE title = 'Week 5: Implement Azure Security (AuthN, RBAC, Managed Identity)'
)
INSERT INTO public.module_sections (module_id, title, "order", sort_order)
SELECT (SELECT id FROM m), s.title, s.ord, s.ord
FROM (VALUES
	('AuthN & RBAC', 1),
	('Managed Identity (MI)', 2)
) AS s(title, ord)
WHERE NOT EXISTS (
	SELECT 1 FROM public.module_sections ms WHERE ms.module_id = (SELECT id FROM m) AND ms.title = s.title
);

-- Week 6 sections
WITH m AS (
	SELECT id FROM public.modules WHERE title = 'Week 6: Implement Azure Security (Key Vault & App Config)'
)
INSERT INTO public.module_sections (module_id, title, "order", sort_order)
SELECT (SELECT id FROM m), s.title, s.ord, s.ord
FROM (VALUES
	('Key Vault secrets', 1),
	('App Configuration', 2)
) AS s(title, ord)
WHERE NOT EXISTS (
	SELECT 1 FROM public.module_sections ms WHERE ms.module_id = (SELECT id FROM m) AND ms.title = s.title
);

-- Week 7 sections
WITH m AS (
	SELECT id FROM public.modules WHERE title = 'Week 7: Monitor & Optimize (App Insights, Redis Cache)'
)
INSERT INTO public.module_sections (module_id, title, "order", sort_order)
SELECT (SELECT id FROM m), s.title, s.ord, s.ord
FROM (VALUES
	('App Insights & KQL', 1),
	('Azure Cache for Redis', 2)
) AS s(title, ord)
WHERE NOT EXISTS (
	SELECT 1 FROM public.module_sections ms WHERE ms.module_id = (SELECT id FROM m) AND ms.title = s.title
);

-- Week 8 sections
WITH m AS (
	SELECT id FROM public.modules WHERE title = 'Week 8: API Integration (API Management & consume APIs)'
)
INSERT INTO public.module_sections (module_id, title, "order", sort_order)
SELECT (SELECT id FROM m), s.title, s.ord, s.ord
FROM (VALUES
	('API Management basics', 1),
	('Policies & rate limiting', 2),
	('Consume external APIs', 3)
) AS s(title, ord)
WHERE NOT EXISTS (
	SELECT 1 FROM public.module_sections ms WHERE ms.module_id = (SELECT id FROM m) AND ms.title = s.title
);

-- Week 9 sections
WITH m AS (
	SELECT id FROM public.modules WHERE title = 'Week 9: Event Solutions (Event Grid, Event Hubs, Service Bus)'
)
INSERT INTO public.module_sections (module_id, title, "order", sort_order)
SELECT (SELECT id FROM m), s.title, s.ord, s.ord
FROM (VALUES
	('Event Grid', 1),
	('Event Hubs', 2),
	('Service Bus queues', 3)
) AS s(title, ord)
WHERE NOT EXISTS (
	SELECT 1 FROM public.module_sections ms WHERE ms.module_id = (SELECT id FROM m) AND ms.title = s.title
);

-- Week 10 sections
WITH m AS (
	SELECT id FROM public.modules WHERE title = 'Week 10: Message Solutions & API Security (Service Bus, OAuth2/OpenID)'
)
INSERT INTO public.module_sections (module_id, title, "order", sort_order)
SELECT (SELECT id FROM m), s.title, s.ord, s.ord
FROM (VALUES
	('Service Bus topics/subscriptions', 1),
	('OAuth2/OpenID Connect & JWT', 2)
) AS s(title, ord)
WHERE NOT EXISTS (
	SELECT 1 FROM public.module_sections ms WHERE ms.module_id = (SELECT id FROM m) AND ms.title = s.title
);
-- SQL untuk membuat database view untuk optimasi query leads
-- Jalankan query ini di Supabase SQL Editor
-- View ini disesuaikan dengan data yang digunakan di LeadTable component

-- Create a comprehensive view for leads data to optimize queries
-- UPDATED: Added new fields for better data handling
CREATE OR REPLACE VIEW leads_data_view AS
SELECT 
    l.id,
    l.title,
    l.full_name,
    l.phone,
    l.created_at,
    
    -- Branch information
    b.id as branch_id,
    b.name as branch_name,
    
    -- Sales consultant information
    sc.id as consultant_id,
    sc.name as consultant_name,
    
    -- Package type information
    pt.id as package_type_id,
    pt.name as package_type,
    
    -- Destination information (for Pelancongan)
    d.id as destination_id,
    d.name as destination_name,
    
    -- Outbound date information (for Pelancongan)
    od.id as outbound_date_id,
    od.start_date as outbound_start_date,
    od.end_date as outbound_end_date,
    
    -- Umrah season information
    us.id as umrah_season_id,
    us.name as umrah_season_name,
    
    -- Umrah category information
    uc.id as umrah_category_id,
    uc.name as umrah_category_name,
    
    -- Computed fields sesuai dengan LeadTable component
    CASE 
        WHEN l.season_id IS NOT NULL THEN us.name
        WHEN l.category_id IS NOT NULL THEN uc.name
        WHEN l.destination_id IS NOT NULL THEN d.name
        WHEN l.package_type_id IS NOT NULL THEN pt.name
        ELSE '-'
    END as interest,
    
    -- Formatted date sesuai dengan format Malaysia
    CASE 
        WHEN l.created_at IS NOT NULL THEN
            TO_CHAR(l.created_at, 'DD ') ||
            CASE EXTRACT(MONTH FROM l.created_at)
                WHEN 1 THEN 'Jan'
                WHEN 2 THEN 'Feb'
                WHEN 3 THEN 'Mac'
                WHEN 4 THEN 'Apr'
                WHEN 5 THEN 'Mei'
                WHEN 6 THEN 'Jun'
                WHEN 7 THEN 'Jul'
                WHEN 8 THEN 'Ogo'
                WHEN 9 THEN 'Sep'
                WHEN 10 THEN 'Okt'
                WHEN 11 THEN 'Nov'
                WHEN 12 THEN 'Dis'
            END ||
            TO_CHAR(l.created_at, ' YYYY')
        ELSE '-'
    END as formatted_date,
    
    -- Avatar initials sesuai dengan getInitials function
    CASE 
        WHEN l.full_name IS NOT NULL THEN 
            UPPER(
                SUBSTRING(SPLIT_PART(l.full_name, ' ', 1), 1, 1) || 
                COALESCE(SUBSTRING(SPLIT_PART(l.full_name, ' ', 2), 1, 1), '')
            )
        WHEN l.title IS NOT NULL THEN 
            UPPER(
                SUBSTRING(SPLIT_PART(l.title, ' ', 1), 1, 1) || 
                COALESCE(SUBSTRING(SPLIT_PART(l.title, ' ', 2), 1, 1), '')
            )
        ELSE 'NA'
    END as avatar_initials,
    
    -- Display name sesuai dengan LeadTable
    COALESCE(l.full_name, l.title, 'Nama tidak tersedia') as display_name,
    
    -- Outbound date range untuk detail modal
    CASE 
        WHEN l.outbound_date_id IS NOT NULL AND od.start_date IS NOT NULL AND od.end_date IS NOT NULL THEN 
            od.start_date || ' - ' || od.end_date
        ELSE '-'
    END as outbound_date_range,
    
    -- TAMBAHAN: Field untuk konsistensi dengan customer_data_view
    -- Email field (default '-' karena tidak ada di tabel leads)
    '-' as email,
    
    -- Address field (default '-' karena tidak ada di tabel leads)
    '-' as address,
    
    -- Source field (default '-' karena tidak ada di tabel leads)
    '-' as source,
    
    -- Budget field (default '-' karena tidak ada di tabel leads)
    '-' as budget,
    
    -- Timeline field (default '-' karena tidak ada di tabel leads)
    '-' as timeline,
    
    -- Notes field (default '-' karena tidak ada di tabel leads)
    '-' as notes,
    
    -- TAMBAHAN: Field untuk detail modal
    -- Season destination untuk detail modal
    CASE 
        WHEN l.season_id IS NOT NULL THEN us.name
        WHEN l.category_id IS NOT NULL THEN uc.name
        WHEN l.destination_id IS NOT NULL THEN d.name
        WHEN l.package_type_id IS NOT NULL THEN pt.name
        ELSE '-'
    END as seasonDestination,
    
    -- Package type untuk detail modal
    pt.name as packageType,
    
    -- Destination untuk detail modal
    d.name as destination,
    
    -- Outbound date untuk detail modal
    CASE 
        WHEN l.outbound_date_id IS NOT NULL AND od.start_date IS NOT NULL AND od.end_date IS NOT NULL THEN 
            od.start_date || ' - ' || od.end_date
        ELSE '-'
    END as outboundDate,
    
    -- TAMBAHAN: Raw data untuk detail modal (JSON format)
    json_build_object(
        'title', l.title,
        'full_name', l.full_name,
        'phone', l.phone,
        'created_at', l.created_at,
        'branch', json_build_object(
            'id', b.id,
            'name', b.name
        ),
        'consultant', json_build_object(
            'id', sc.id,
            'name', sc.name
        ),
        'package_type', json_build_object(
            'id', pt.id,
            'name', pt.name
        ),
        'destination', json_build_object(
            'id', d.id,
            'name', d.name
        ),
        'outbound_date', json_build_object(
            'id', od.id,
            'start_date', od.start_date,
            'end_date', od.end_date
        ),
        'umrah_season', json_build_object(
            'id', us.id,
            'name', us.name
        ),
        'umrah_category', json_build_object(
            'id', uc.id,
            'name', uc.name
        )
    ) as rawData

FROM leads l
LEFT JOIN branches b ON l.branch_id = b.id
LEFT JOIN sales_consultant sc ON l.sales_consultant_id = sc.id
LEFT JOIN package_types pt ON l.package_type_id = pt.id
LEFT JOIN destinations d ON l.destination_id = d.id
LEFT JOIN outbound_dates od ON l.outbound_date_id = od.id
LEFT JOIN umrah_seasons us ON l.season_id = us.id
LEFT JOIN umrah_categories uc ON l.category_id = uc.id
ORDER BY l.created_at DESC;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_branch_id ON leads(branch_id);
CREATE INDEX IF NOT EXISTS idx_leads_sales_consultant_id ON leads(sales_consultant_id);
CREATE INDEX IF NOT EXISTS idx_leads_package_type_id ON leads(package_type_id);
CREATE INDEX IF NOT EXISTS idx_leads_destination_id ON leads(destination_id);
CREATE INDEX IF NOT EXISTS idx_leads_outbound_date_id ON leads(outbound_date_id);
CREATE INDEX IF NOT EXISTS idx_leads_season_id ON leads(season_id);
CREATE INDEX IF NOT EXISTS idx_leads_category_id ON leads(category_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_branch_created ON leads(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_consultant_created ON leads(sales_consultant_id, created_at);

-- Create full-text search index for leads
CREATE INDEX IF NOT EXISTS idx_leads_full_text ON leads USING gin(
    to_tsvector('english', 
        COALESCE(full_name, '') || ' ' || 
        COALESCE(title, '') || ' ' || 
        COALESCE(phone, '')
    )
);

-- Create additional indexes for new fields
CREATE INDEX IF NOT EXISTS idx_leads_title ON leads(title);
CREATE INDEX IF NOT EXISTS idx_leads_full_name ON leads(full_name);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);

-- Create composite index for search functionality
CREATE INDEX IF NOT EXISTS idx_leads_search ON leads USING gin(
    to_tsvector('english', 
        COALESCE(title, '') || ' ' || 
        COALESCE(full_name, '') || ' ' || 
        COALESCE(phone, '')
    )
);



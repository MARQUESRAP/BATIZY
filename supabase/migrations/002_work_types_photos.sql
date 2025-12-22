-- ============================================
-- ChantierPro - Ajout Tables Supplémentaires
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Table des types de travaux
CREATE TABLE IF NOT EXISTS work_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    materials JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;

-- Policy pour les types de travaux (lecture pour tous, écriture pour admin)
CREATE POLICY "Lecture work_types pour tous" ON work_types
    FOR SELECT USING (true);

CREATE POLICY "Écriture work_types" ON work_types
    FOR ALL USING (true);

-- Ajouter colonne photos aux rapports si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rapports' AND column_name = 'photos'
    ) THEN
        ALTER TABLE rapports ADD COLUMN photos TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- ============================================
-- CRÉATION DU BUCKET STORAGE POUR LES PHOTOS
-- ============================================
-- Note: Exécuter ces commandes dans l'onglet "Storage" de Supabase
-- ou via l'API Storage

-- Créer le bucket (via l'interface Supabase Storage)
-- Nom: rapport-photos
-- Public: Oui

-- ============================================
-- DONNÉES INITIALES - TYPES DE TRAVAUX
-- ============================================

INSERT INTO work_types (name, materials) VALUES
('Couverture', '[
    {"name": "Tuiles", "unit": "m²", "defaultQuantity": 0},
    {"name": "Ardoises", "unit": "m²", "defaultQuantity": 0},
    {"name": "Liteaux", "unit": "ml", "defaultQuantity": 0},
    {"name": "Écran sous-toiture", "unit": "m²", "defaultQuantity": 0},
    {"name": "Faîtières", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Gouttières", "unit": "ml", "defaultQuantity": 0},
    {"name": "Clous/Vis", "unit": "kg", "defaultQuantity": 0}
]'::jsonb),

('Plomberie', '[
    {"name": "Tuyaux cuivre", "unit": "ml", "defaultQuantity": 0},
    {"name": "Tuyaux PVC", "unit": "ml", "defaultQuantity": 0},
    {"name": "Raccords", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Robinetterie", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Joints", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Silicone", "unit": "cartouches", "defaultQuantity": 0},
    {"name": "Téflon", "unit": "rouleaux", "defaultQuantity": 0}
]'::jsonb),

('Électricité', '[
    {"name": "Câble électrique", "unit": "ml", "defaultQuantity": 0},
    {"name": "Prises", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Interrupteurs", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Disjoncteurs", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Tableau électrique", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Gaines ICTA", "unit": "ml", "defaultQuantity": 0},
    {"name": "Boîtes de dérivation", "unit": "pièces", "defaultQuantity": 0}
]'::jsonb),

('Maçonnerie', '[
    {"name": "Ciment", "unit": "sacs", "defaultQuantity": 0},
    {"name": "Sable", "unit": "m³", "defaultQuantity": 0},
    {"name": "Parpaings", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Briques", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Béton", "unit": "m³", "defaultQuantity": 0},
    {"name": "Ferraille", "unit": "kg", "defaultQuantity": 0},
    {"name": "Enduit", "unit": "sacs", "defaultQuantity": 0}
]'::jsonb),

('Peinture', '[
    {"name": "Peinture intérieure", "unit": "L", "defaultQuantity": 0},
    {"name": "Peinture extérieure", "unit": "L", "defaultQuantity": 0},
    {"name": "Sous-couche", "unit": "L", "defaultQuantity": 0},
    {"name": "Enduit de rebouchage", "unit": "kg", "defaultQuantity": 0},
    {"name": "Bâches de protection", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Rouleaux", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Pinceaux", "unit": "pièces", "defaultQuantity": 0}
]'::jsonb),

('Chauffage', '[
    {"name": "Radiateurs", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Tuyaux chauffage", "unit": "ml", "defaultQuantity": 0},
    {"name": "Vannes", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Thermostat", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Circulateur", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Purgeurs", "unit": "pièces", "defaultQuantity": 0}
]'::jsonb),

('Isolation', '[
    {"name": "Laine de verre", "unit": "m²", "defaultQuantity": 0},
    {"name": "Laine de roche", "unit": "m²", "defaultQuantity": 0},
    {"name": "Polystyrène", "unit": "m²", "defaultQuantity": 0},
    {"name": "Pare-vapeur", "unit": "m²", "defaultQuantity": 0},
    {"name": "Rails/Montants", "unit": "ml", "defaultQuantity": 0},
    {"name": "Plaques de plâtre", "unit": "pièces", "defaultQuantity": 0}
]'::jsonb),

('Carrelage', '[
    {"name": "Carreaux", "unit": "m²", "defaultQuantity": 0},
    {"name": "Colle carrelage", "unit": "sacs", "defaultQuantity": 0},
    {"name": "Joint", "unit": "kg", "defaultQuantity": 0},
    {"name": "Croisillons", "unit": "pièces", "defaultQuantity": 0},
    {"name": "Profilés alu", "unit": "ml", "defaultQuantity": 0},
    {"name": "Primaire", "unit": "L", "defaultQuantity": 0}
]'::jsonb)

ON CONFLICT DO NOTHING;

-- ============================================
-- INDEX POUR PERFORMANCES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_work_types_name ON work_types(name);

-- Fin du script

-- ============================================
-- CHANTIERPRO - DONNÉES INITIALES SUPABASE
-- ============================================
-- Exécute ce script dans l'éditeur SQL de Supabase
-- après avoir créé le schéma (schema.sql)
-- ============================================

-- ============================================
-- 1. UTILISATEURS
-- ============================================

INSERT INTO users (id, name, code, role, email, phone, is_active) VALUES
-- Administrateurs
(gen_random_uuid(), 'Raphaël Admin', '0000', 'admin', 'raph@gralt.fr', '0612345678', true),

-- Techniciens
(gen_random_uuid(), 'Jean Martin', '1234', 'technicien', NULL, '0623456789', true),
(gen_random_uuid(), 'Luc Bernard', '2345', 'technicien', NULL, '0634567890', true),
(gen_random_uuid(), 'Marc Durand', '3456', 'technicien', NULL, '0645678901', true),
(gen_random_uuid(), 'Paul Moreau', '4567', 'technicien', NULL, '0656789012', true),
(gen_random_uuid(), 'Antoine Lefebvre', '5678', 'technicien', NULL, '0667890123', true);

-- ============================================
-- 2. TYPES DE TRAVAUX
-- ============================================

INSERT INTO work_types (id, name, materials) VALUES
(gen_random_uuid(), 'Couverture', '[
  {"name": "Tuiles", "unit": "pièces", "defaultQuantity": 100},
  {"name": "Liteaux", "unit": "mètres", "defaultQuantity": 50},
  {"name": "Écran sous-toiture", "unit": "m²", "defaultQuantity": 30},
  {"name": "Faîtières", "unit": "pièces", "defaultQuantity": 10},
  {"name": "Gouttières", "unit": "mètres", "defaultQuantity": 15}
]'),

(gen_random_uuid(), 'Plomberie', '[
  {"name": "Tuyaux PVC", "unit": "mètres", "defaultQuantity": 20},
  {"name": "Raccords", "unit": "pièces", "defaultQuantity": 15},
  {"name": "Joints", "unit": "pièces", "defaultQuantity": 30},
  {"name": "Robinetterie", "unit": "pièces", "defaultQuantity": 3},
  {"name": "Cumulus", "unit": "pièces", "defaultQuantity": 1}
]'),

(gen_random_uuid(), 'Électricité', '[
  {"name": "Câbles", "unit": "mètres", "defaultQuantity": 50},
  {"name": "Prises", "unit": "pièces", "defaultQuantity": 10},
  {"name": "Interrupteurs", "unit": "pièces", "defaultQuantity": 5},
  {"name": "Disjoncteurs", "unit": "pièces", "defaultQuantity": 4},
  {"name": "Tableau électrique", "unit": "pièces", "defaultQuantity": 1}
]'),

(gen_random_uuid(), 'Maçonnerie', '[
  {"name": "Parpaings", "unit": "pièces", "defaultQuantity": 100},
  {"name": "Ciment", "unit": "sacs", "defaultQuantity": 10},
  {"name": "Sable", "unit": "sacs", "defaultQuantity": 20},
  {"name": "Fer à béton", "unit": "barres", "defaultQuantity": 15},
  {"name": "Briques", "unit": "pièces", "defaultQuantity": 50}
]'),

(gen_random_uuid(), 'Peinture', '[
  {"name": "Peinture intérieure", "unit": "litres", "defaultQuantity": 20},
  {"name": "Peinture extérieure", "unit": "litres", "defaultQuantity": 15},
  {"name": "Sous-couche", "unit": "litres", "defaultQuantity": 10},
  {"name": "Rouleaux", "unit": "pièces", "defaultQuantity": 5},
  {"name": "Bâches", "unit": "pièces", "defaultQuantity": 3}
]'),

(gen_random_uuid(), 'Isolation', '[
  {"name": "Laine de verre", "unit": "rouleaux", "defaultQuantity": 10},
  {"name": "Laine de roche", "unit": "rouleaux", "defaultQuantity": 8},
  {"name": "Plaques de plâtre", "unit": "pièces", "defaultQuantity": 20},
  {"name": "Rails métalliques", "unit": "mètres", "defaultQuantity": 30},
  {"name": "Vis placo", "unit": "boîtes", "defaultQuantity": 3}
]'),

(gen_random_uuid(), 'Charpente', '[
  {"name": "Poutres bois", "unit": "pièces", "defaultQuantity": 10},
  {"name": "Chevrons", "unit": "mètres", "defaultQuantity": 40},
  {"name": "Connecteurs métalliques", "unit": "pièces", "defaultQuantity": 50},
  {"name": "Vis à bois", "unit": "boîtes", "defaultQuantity": 5}
]'),

(gen_random_uuid(), 'Zinguerie', '[
  {"name": "Zinc", "unit": "m²", "defaultQuantity": 20},
  {"name": "Gouttières zinc", "unit": "mètres", "defaultQuantity": 15},
  {"name": "Descentes", "unit": "mètres", "defaultQuantity": 10},
  {"name": "Soudure", "unit": "kg", "defaultQuantity": 2}
]');

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier les utilisateurs
SELECT 'Utilisateurs créés:' as info, count(*) as total FROM users;

-- Vérifier les types de travaux
SELECT 'Types de travaux créés:' as info, count(*) as total FROM work_types;

-- Afficher les codes d'accès
SELECT name, code, role FROM users ORDER BY role, name;

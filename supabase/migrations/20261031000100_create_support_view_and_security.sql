-- M2: vista de equipos con sala y conteo reciente, y cierre de acceso público

CREATE OR REPLACE VIEW v_equipos
WITH (security_invoker = true) AS
SELECT
  e.*,
  s.nombre AS sala_nombre,
  (SELECT COUNT(*) FROM incidencias i
     WHERE i.equipo_id = e.id
       AND i.fecha >= (CURRENT_DATE - INTERVAL '30 days')) AS incidencias_30d  -- apoyo a RN-09
FROM equipos e
JOIN salas s ON s.id = e.sala_id;

ALTER TABLE salas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE tecnicos    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON salas, equipos, incidencias, tecnicos FROM anon, authenticated;
REVOKE ALL ON v_equipos FROM anon, authenticated;

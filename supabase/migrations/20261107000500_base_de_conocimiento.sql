-- M17 · Base de conocimiento: guías de solución que soporte escribe y cualquiera consulta. Al
-- reportar una falla se sugieren las guías parecidas; si una resuelve el problema, no hace falta
-- reportarlo. Los votos "¿le sirvió?" ordenan las guías.

CREATE TABLE IF NOT EXISTS articulos (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo          varchar(120) NOT NULL,
  categoria       text         NOT NULL DEFAULT 'otro',
  contenido       text         NOT NULL,
  palabras_clave  varchar(200) NOT NULL DEFAULT '',
  autor           text         NOT NULL,          -- correo de quien la escribió
  util_si         integer      NOT NULL DEFAULT 0,
  util_no         integer      NOT NULL DEFAULT 0,
  creado_en       timestamptz  NOT NULL DEFAULT now(),
  actualizado_en  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT articulos_titulo_minimo   CHECK (char_length(btrim(titulo)) >= 5),
  CONSTRAINT articulos_contenido_largo CHECK (char_length(btrim(contenido)) BETWEEN 20 AND 5000),
  CONSTRAINT articulos_categoria_valida CHECK (categoria IN ('hardware', 'software', 'red', 'perifericos', 'otro')),
  CONSTRAINT articulos_votos_validos   CHECK (util_si >= 0 AND util_no >= 0)
);

-- Búsqueda en español (título con más peso que las palabras clave y el contenido).
CREATE INDEX IF NOT EXISTS ix_articulos_busqueda ON articulos USING gin (
  (setweight(to_tsvector('spanish', titulo), 'A')
   || setweight(to_tsvector('spanish', palabras_clave), 'B')
   || setweight(to_tsvector('spanish', contenido), 'C'))
);

DROP TRIGGER IF EXISTS trg_articulos_actualizado ON articulos;
CREATE OR REPLACE FUNCTION ss_articulo_actualizado()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  -- Los votos no cuentan como edición de la guía.
  IF NEW.titulo IS DISTINCT FROM OLD.titulo OR NEW.contenido IS DISTINCT FROM OLD.contenido
     OR NEW.categoria IS DISTINCT FROM OLD.categoria OR NEW.palabras_clave IS DISTINCT FROM OLD.palabras_clave THEN
    NEW.actualizado_en := now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_articulos_actualizado BEFORE UPDATE ON articulos
  FOR EACH ROW EXECUTE FUNCTION ss_articulo_actualizado();

-- Para buscar casos cerrados parecidos (sugerencias de solución).
CREATE INDEX IF NOT EXISTS ix_incidencias_busqueda ON incidencias USING gin (to_tsvector('spanish', descripcion));

ALTER TABLE articulos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON articulos FROM anon, authenticated;

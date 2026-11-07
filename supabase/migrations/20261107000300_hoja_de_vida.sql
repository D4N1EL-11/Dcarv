-- M15 · Hoja de vida técnica de cada equipo y costo de los repuestos.
-- Todos los datos son opcionales: un equipo registrado antes queda "sin dato" hasta que soporte
-- los complete. Con la fecha de compra y la garantía se avisa de garantías por vencer y equipos
-- obsoletos (lib/reglas/hojaDeVida.ts); con el costo unitario de cada repuesto se calcula cuánto
-- ha costado reparar cada equipo.

ALTER TABLE equipos ADD COLUMN IF NOT EXISTS marca_modelo      varchar(80);
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS procesador        varchar(80);
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS ram_gb            smallint;
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS disco_gb          integer;
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS sistema_operativo varchar(60);
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS numero_serie      varchar(60);
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS fecha_compra      date;
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS garantia_hasta    date;

DO $$
BEGIN
  ALTER TABLE equipos ADD CONSTRAINT equipos_hoja_de_vida_valida CHECK (
    (ram_gb IS NULL OR ram_gb BETWEEN 1 AND 1024)
    AND (disco_gb IS NULL OR disco_gb BETWEEN 1 AND 100000)
    AND (garantia_hasta IS NULL OR fecha_compra IS NULL OR garantia_hasta >= fecha_compra)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Costo de cada unidad en pesos colombianos (0 = sin dato).
ALTER TABLE repuestos ADD COLUMN IF NOT EXISTS costo_unitario numeric(12, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  ALTER TABLE repuestos ADD CONSTRAINT repuestos_costo_valido CHECK (costo_unitario >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- El costo se congela al usar la pieza: si después sube el precio, las reparaciones pasadas no cambian.
ALTER TABLE repuestos_usados ADD COLUMN IF NOT EXISTS costo_unitario numeric(12, 2) NOT NULL DEFAULT 0;

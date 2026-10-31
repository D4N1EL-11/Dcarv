# Fase 1 completada · Base de datos

Fecha: 2026-10-31

## Migraciones

La conexión directa a Supabase se verificó antes de aplicar cambios. En ese momento no existían `salas`, `equipos`, `incidencias`, `tecnicos`, `seq_numero_caso`, `v_equipos` ni `_migrations`.

La migración `20261003000000_create_users_table.sql` ya estaba aplicada: existían `public.users` con las columnas esperadas y `public.sync_auth_user()`. Se registró en `_migrations` sin reejecutarla.

Salida de `npm.cmd run db:migrar`:

```text
omitida 20261003000000_create_users_table.sql: migración previa ya aplicada; registrada en _migrations
aplicada 20261031000000_create_support_tables.sql
aplicada 20261031000100_create_support_view_and_security.sql
```

## Verificación de base de datos

Salida completa de `npm.cmd run db:verificar`:

```text
Existencia de objetos:
OK - salas
OK - equipos
OK - incidencias
OK - tecnicos
OK - seq_numero_caso
OK - v_equipos
Filas por tabla:
salas: 0
equipos: 0
incidencias: 0
tecnicos: 0
Restricciones e índices requeridos:
OK - equipos_codigo_unico
OK - ux_salas_nombre
OK - incidencias_numero_unico
Row Level Security:
OK - salas RLS activo
OK - equipos RLS activo
OK - incidencias RLS activo
OK - tecnicos RLS activo
Pruebas de integridad (transacción con ROLLBACK):
OK - a) nombre de sala sin distinción de mayúsculas: 23505 (ux_salas_nombre)
OK - b) estado funcional por defecto: funcional
OK - c) código de equipo único: 23505 (equipos_codigo_unico)
OK - d) estado de equipo 'roto' rechazado: 23514 (equipos_estado_valido)
OK - e) número de caso por secuencia: INC-0001
OK - f) descripción 'ab' rechazada: 23514 (incidencias_desc_minima)
OK - g) estado de incidencia 'pendiente' rechazado: 23514 (incidencias_estado_valido)
Total de fallas: 0
```

La transacción de verificación terminó con `ROLLBACK`; no dejó filas en las cuatro tablas. PostgreSQL no revierte el avance de una secuencia durante un rollback, así que el caso de prueba consumió `INC-0001`. Los siguientes números de caso pueden presentar saltos, como es normal para una secuencia.

## Compilación

`npm.cmd run build`: **éxito**, código de salida 0.

## Dependencias

Se agregó `pg` como dependencia de producción junto con `db:migrar` y `db:verificar`. `npm install` informó 65 vulnerabilidades en el árbol de dependencias (1 baja, 34 moderadas, 26 altas y 4 críticas); no se aplicaron actualizaciones automáticas.

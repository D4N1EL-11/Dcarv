# Soporte de Salas · Plan técnico de implementación

> Control de Calidad y Soporte de Salas de Sistemas · versión técnica 1.0, derivada del plan funcional de Dcarv (versión 2, Flask + JSON)
> Asignatura: Lógica y Programación (SIST0200) · Universidad Sergio Arboleda, Santa Marta · Docente: Jhonatan Castro Polo
> Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase Postgres · Despliegue en Vercel
> Ejecución: GitHub Copilot en modo Agente, con los prompts de `doc/PROMPTS_SOPORTE_SALAS.md`

---

## Índice

0. [Cómo se usa este documento](#0-cómo-se-usa-este-documento)
1. [Punto de partida](#1-punto-de-partida)
2. [Advertencia de seguridad previa](#2-advertencia-de-seguridad-previa)
3. [Traducción del stack del plan funcional](#3-traducción-del-stack-del-plan-funcional)
4. [Alcance](#4-alcance)
5. [Acceso](#5-acceso)
6. [Estados](#6-estados)
7. [Reglas de negocio](#7-reglas-de-negocio)
8. [Casos de uso](#8-casos-de-uso)
9. [Modelo de datos](#9-modelo-de-datos)
10. [Arquitectura del código](#10-arquitectura-del-código)
11. [Contratos de API](#11-contratos-de-api)
12. [Pantallas](#12-pantallas)
13. [Identidad visual](#13-identidad-visual)
14. [Fechas y zona horaria](#14-fechas-y-zona-horaria)
15. [Seguridad e integridad](#15-seguridad-e-integridad)
16. [Pruebas](#16-pruebas)
17. [Plan de ejecución](#17-plan-de-ejecución)
18. [Funcionalidades opcionales](#18-funcionalidades-opcionales)
19. [Glosario](#19-glosario)

---

## 0. Cómo se usa este documento

Este plan es el documento rector del proyecto. Copilot lo lee antes de cada tarea y los prompts remiten a sus secciones por número. Si un prompt y este plan no coinciden, prevalece el plan.

| Archivo en el repositorio | Función |
|---|---|
| `doc/PLAN_SOPORTE_SALAS.md` | Este documento |
| `doc/PROMPTS_SOPORTE_SALAS.md` | Prompts en orden de ejecución |
| `doc/ESTADO_ACTUAL.md` | Radiografía del repositorio antes de empezar (lo crea P00) |
| `doc/ESTADO_EJECUCION.md` | Avance prompt por prompt |
| `doc/checkpoints/FASE_N_COMPLETADA.md` | Evidencia del cierre de cada fase |
| `.github/copilot-instructions.md` | Reglas permanentes que Copilot aplica en todas las conversaciones |

---

## 1. Punto de partida

### 1.1 Lo que ya existe y no se reconstruye

- Proyecto Next.js con TypeScript desplegado en Vercel.
- Proyecto Supabase conectado al despliegue.
- Login funcionando.
- Variables de entorno en `.env.local` (local) y en el proyecto de Vercel (producción).

### 1.2 Lo que se verifica en P00 antes de escribir código

| Aspecto | Por qué importa |
|---|---|
| Mecanismo del login | El adaptador `lib/auth/sesion.ts` debe envolverlo sin reescribirlo |
| Ruta a la que redirige el login | Se cambia a `/soporte` |
| Archivo de middleware existente | En Next.js 16 se llama `proxy.ts`; en versiones anteriores, `middleware.ts` |
| Variable de conexión directa a Postgres | El reporte de incidencias usa transacciones con `pg`; si no existe, se obtiene en P00 |
| Mecanismo de migraciones existente | Las tablas nuevas se aplican con ese mecanismo; si no existe, se crea `npm run db:migrar` |
| Versión de Tailwind | Define dónde se declaran los colores (sección 13) |
| Rutas `/soporte` o `/api/soporte` | No deben existir antes; si existen, se reporta el conflicto |
| Tablas previas llamadas `salas`, `equipos`, `incidencias` o `tecnicos` | Si existen, se reporta su estructura antes de crear las nuevas |

### 1.3 Regla sobre el login

El plan funcional dice que no hay autenticación por roles: cualquier persona con acceso puede reportar y gestionar incidencias (sección 7). En el stack del curso la aplicación queda publicada en una URL de Vercel; dejarla abierta expondría el inventario y las incidencias a cualquiera. Se usa el login existente como puerta única de acceso, sin agregar roles diferenciados: toda persona con sesión válida puede ver y gestionar todo, como pide el plan, pero protegido. El login no se reescribe; solo se agrega el adaptador `lib/auth/sesion.ts` (`obtenerSesion`, `exigirSesion`), la protección de `/soporte/*` y `/api/soporte/*`, y la redirección posterior al login hacia `/soporte`.

---

## 2. Advertencia de seguridad previa

El plan funcional entregado incluía un correo y una contraseña reales al final. Antes de ejecutar estos prompts:

1. **Cambiar la contraseña** de la cuenta expuesta desde el sistema de login.
2. **No volver a escribir credenciales en ningún archivo** del repositorio o de la entrega.
3. **Confirmar que `.env.local` está en `.gitignore`** y que ningún archivo versionado tiene valores de variables de entorno.

Este paso es obligatorio y previo a todo lo demás.

---

## 3. Traducción del stack del plan funcional

El plan funcional está pensado para Python + Flask + Jinja2 + archivo `datos.json`. Ese stack no es el del curso (Next.js + Supabase + Vercel) y el JSON no sirve en Vercel, que es serverless y de sistema de archivos efímero. La conversión conserva toda la lógica, las reglas y la separación de capas que el plan ya buscaba; cambia la plomería.

| Pieza del plan funcional | En este plan técnico | Motivo |
|---|---|---|
| Python + Flask | Next.js (App Router) + TypeScript | Es el stack del curso y ya está desplegado |
| Jinja2 (`base.html` + páginas) | Componentes de React con un layout común | Mismo papel: una estructura común y cada página aporta su contenido |
| Archivo `datos.json` | Supabase Postgres | El JSON no persiste en Vercel; el propio plan preveía migrar a una base (dice "la siguiente migración natural sería a SQLite") |
| `modelos.py`, `sistema.py`, `app.py` | `lib/datos/` (datos), `lib/reglas/` (lógica), `app/api/` + `app/soporte/` (web) | El plan ya separaba datos, lógica y web; se conserva esa separación para poder probar la lógica sin la interfaz |
| `id` de incidencia como `INC-0001` | UUID interno + número de caso legible generado por la base | Mantiene el número de caso legible que el plan muestra, con un identificador robusto detrás |
| CSS propio sin framework | Tailwind (el del curso) con tokens propios | Mismo resultado visual sencillo, sin librería de componentes |

Lo que **no cambia**: el inventario por sala, los tres estados del equipo, los tres estados de la incidencia, el cambio automático del equipo a "en reparación" al reportar, la libertad de cambiar el estado del equipo sin secuencia, el historial ordenado del más reciente al más antiguo, y las reglas de las dos funcionalidades opcionales (asignación a técnico y alerta por incidencias repetidas).

---

## 4. Alcance

### 4.1 Módulo mínimo

| ID | Funcionalidad (plan funcional) | Casos de uso | Prompts |
|---|---|---|---|
| F1 | Registrar el inventario de equipos por sala | CU-01, CU-02 | P04, P05, P07 |
| F2 | Reportar una incidencia sobre un equipo | CU-03 | P02, P04, P05, P08 |
| F3 | Cambiar el estado del equipo (funcional / en reparación / dado de baja) | CU-04 | P04, P05, P07 |
| F4 | Consultar el historial de incidencias de un equipo | CU-05 | P04, P05, P08 |

El plan indica que estas cuatro ya están construidas en su versión Flask; aquí se reconstruyen en el stack del curso como el módulo mínimo.

### 4.2 Funcionalidades opcionales

| ID | Funcionalidad | Casos de uso | Prompts |
|---|---|---|---|
| F5 | Asignar una incidencia a un técnico y seguir su estado | CU-06, CU-07 | P09 |
| F6 | Alertar equipos con incidencias repetidas (candidatos a baja) | CU-08 | P09 |

Se construyen solo con la fase 5 cerrada. F5 incluye la regla de reasignación automática tras 5 días (RN-10); F6 incluye la regla de 3 incidencias en 30 días (RN-09).

### 4.3 Fuera de alcance

Se mantiene la lista del plan funcional: compra o gestión de repuestos, equipos o espacios fuera de las salas de sistemas, aplicación móvil nativa, roles de usuario diferenciados, y reportes o estadísticas más allá de los 30 días de la regla de baja.

### 4.4 Decisiones de alcance de esta versión técnica

| Decisión | Motivo |
|---|---|
| La sala se modela como su propia tabla (no solo un texto en el equipo) | El plan consulta "cuántos equipos hay por sala" y agrupa por sala; una tabla de salas lo hace limpio y evita nombres de sala repetidos con distinta grafía |
| El número de caso legible (`INC-0001`) lo genera la base con una secuencia | Mantiene el identificador que el plan muestra, consecutivo y único |
| Un equipo puede cambiar a cualquiera de los tres estados sin secuencia | El plan lo decidió así explícitamente (simplificación deliberada frente a su v1) |
| Se permite reportar una incidencia sobre un equipo que ya tiene una abierta | Caso límite del plan: una falla puede tener varias causas |
| Reportar una incidencia pone el equipo en "en reparación" salvo que esté "dado de baja" | Un equipo dado de baja no debería volver a "en reparación" solo por un reporte; se documenta esta precisión |
| El total de equipos por sala se calcula, no se guarda | El plan lo dice: "se calcula a partir del número de equipos registrados" |
| Un equipo no se elimina; el estado "dado de baja" cumple ese papel | Conserva el historial de incidencias |

---

## 5. Acceso

| Actor | Acceso | Puede hacer |
|---|---|---|
| Usuario (soporte) | Login existente como puerta | Registrar salas y equipos, reportar incidencias, cambiar estados, consultar historiales; y (opcional) asignar técnicos y ver alertas |
| Sistema | Interno | Valida entradas, genera el número de caso, cambia el equipo a "en reparación" al reportar, cuenta incidencias para las alertas |

| Ruta | Sin sesión | Con sesión |
|---|:-:|:-:|
| `/` | Redirige al login | Redirige a `/soporte` |
| `/soporte/*` | Redirige al login | Sí |
| `/api/soporte/*` | 401 | Sí |

---

## 6. Estados

### 6.1 Estado del equipo (`equipos.estado`)

| Código | Etiqueta | Significado |
|---|---|---|
| `funcional` | Funcional | Disponible para uso |
| `en_reparacion` | En reparación | Tiene una falla en atención |
| `dado_de_baja` | Dado de baja | Retirado de servicio |

El plan escribe "en reparación" con espacio; en código se usa `en_reparacion`. No hay secuencia obligatoria: el usuario puede poner cualquiera de los tres en cualquier momento (RN-07). La única automática es el paso a `en_reparacion` al reportar (RN-06).

### 6.2 Estado de la incidencia (`incidencias.estado`)

| Código | Etiqueta | Significado |
|---|---|---|
| `abierta` | Abierta | Reportada, sin atender |
| `en_revision` | En revisión | Asignada a un técnico (opcional, F5) |
| `cerrada` | Cerrada | Resuelta |

En el módulo mínimo una incidencia nace `abierta` y puede cerrarse. El estado `en_revision` lo usa la funcionalidad opcional de asignación.

---

## 7. Reglas de negocio

| ID | Regla | Origen | Dónde se aplica |
|---|---|---|---|
| RN-01 | El código del equipo es único e identifica al equipo (ej. `PC-SALA1-03`) | Sección 4.1 del plan | BD UNIQUE; Zod |
| RN-02 | Un equipo nuevo nace con estado `funcional` | Sección 4.1 | Servicio; BD DEFAULT |
| RN-03 | Al reportar una incidencia, el equipo debe existir | Sección 4.2 | Servicio; BD foreign key |
| RN-04 | La incidencia nace con estado `abierta` y fecha asignada por el sistema | Sección 4.2 | Servicio; BD DEFAULT |
| RN-05 | Cada incidencia recibe un número de caso legible y único (`INC-0001`, `INC-0002`, …) | Sección 5 | BD secuencia + formato |
| RN-06 | Reportar una incidencia cambia el equipo a `en_reparacion`, salvo que esté `dado_de_baja` (sección 4.4) | Regla del plan "ya implementada" | Servicio `reportarIncidencia` |
| RN-07 | El estado del equipo puede cambiarse a cualquiera de los tres en cualquier momento, sin secuencia | Regla del plan (simplificación) | Servicio `cambiarEstadoEquipo` |
| RN-08 | Se permite reportar una incidencia sobre un equipo que ya tiene otra abierta; ambas quedan en su historial | Caso límite del plan | Servicio: sin bloqueo por incidencia abierta |
| RN-09 | Un equipo es candidato a baja si acumula 3 o más incidencias en los últimos 30 días (opcional, F6) | Sección 6 del plan | `lib/reglas/alertas.ts` |
| RN-10 | Una incidencia con más de 5 días sin cambio de estado se reasigna automáticamente a otro técnico (opcional, F5) | Sección 6 del plan | Sección 18 |
| RN-11 | Asignar un técnico a una incidencia exige que esté `abierta`; la pasa a `en_revision` (opcional, F5) | Sección 4.5 del plan | Sección 18 |
| RN-12 | El código del equipo y el nombre de la sala no pueden estar vacíos | Agregada | Zod; BD CHECK |
| RN-13 | La descripción de la incidencia no puede estar vacía (mínimo 3 caracteres) | Agregada | Zod; BD CHECK |
| RN-14 | El historial de un equipo se ordena de la incidencia más reciente a la más antigua | Sección 4.4 del plan | `lib/datos/incidencias.ts` |
| RN-15 | Un equipo no se elimina; el estado `dado_de_baja` lo retira de servicio conservando su historial | Sección 4.4 | Servicio; BD `ON DELETE RESTRICT` |

### 7.1 Validaciones frente a reglas de negocio

| Validación (rechaza datos mal formados) | Regla de negocio (decisión del dominio) |
|---|---|
| El código del equipo no puede estar vacío ni repetirse | Reportar una incidencia pone el equipo en reparación |
| La descripción de la incidencia no puede estar vacía | Un equipo con 3 incidencias en 30 días es candidato a baja |
| El estado debe ser uno de los tres permitidos | El estado del equipo puede cambiar sin seguir una secuencia |

---

## 8. Casos de uso

| ID | Entrada | Precondición | Efecto | Errores posibles |
|---|---|---|---|---|
| CU-01 Registrar sala | nombre de la sala | nombre no repetido | Sala creada | `DATOS_INVALIDOS`, `SALA_DUPLICADA` |
| CU-02 Registrar equipo | código, sala | código no repetido; la sala existe | Equipo `funcional` en esa sala | `DATOS_INVALIDOS`, `CODIGO_DUPLICADO`, `SALA_NO_ENCONTRADA` |
| CU-03 Reportar incidencia | código del equipo, descripción | el equipo existe | Incidencia `abierta` con número de caso y fecha; el equipo pasa a `en_reparacion` (salvo baja) | `EQUIPO_NO_ENCONTRADO`, `DATOS_INVALIDOS` |
| CU-04 Cambiar estado del equipo | código, nuevo estado | el equipo existe; estado válido | Estado del equipo actualizado | `EQUIPO_NO_ENCONTRADO`, `ESTADO_INVALIDO` |
| CU-05 Consultar historial | código del equipo | el equipo existe | Lista de incidencias del equipo, de la más reciente a la más antigua | `EQUIPO_NO_ENCONTRADO` |
| CU-06 Asignar técnico (opcional) | número de caso, técnico | la incidencia está `abierta` | Incidencia `en_revision` con técnico | `INCIDENCIA_NO_ENCONTRADA`, `INCIDENCIA_NO_ASIGNABLE` |
| CU-07 Cerrar incidencia | número de caso | la incidencia no está cerrada | Incidencia `cerrada` | `INCIDENCIA_NO_ENCONTRADA` |
| CU-08 Ver candidatos a baja (opcional) | ninguna | — | Equipos con 3+ incidencias en 30 días | — |

### 8.1 Secuencia de CU-03 (reportar incidencia)

Todo ocurre dentro de `conTransaccion`:

1. `validarDescripcion(descripcion)` (no vacía, mínimo 3 caracteres).
2. Buscar el equipo por código; si no existe, `EQUIPO_NO_ENCONTRADO`.
3. Insertar la incidencia con estado `abierta`, `fecha = hoyBogota()` y un número de caso de la secuencia (RN-04, RN-05).
4. Si el equipo no está `dado_de_baja`, cambiarlo a `en_reparacion` (RN-06).
5. Confirmar y devolver la incidencia (con su número de caso) y el nuevo estado del equipo.

```ts
export async function reportarIncidencia(codigoEquipo: string, descripcion: string): Promise<ResultadoIncidencia> {
  validarDescripcion(descripcion);
  return conTransaccion(async (tx) => {
    const equipo = await obtenerEquipoPorCodigo(tx, codigoEquipo);  // EQUIPO_NO_ENCONTRADO
    const incidencia = await insertarIncidencia(tx, {
      equipoId: equipo.id, descripcion: descripcion.trim(),
      estado: 'abierta', fecha: hoyBogota(),                        // RN-04, RN-05 (nro de caso por secuencia)
    });
    let estadoEquipo = equipo.estado;
    if (equipo.estado !== 'dado_de_baja') {                         // RN-06 (precisión sección 4.4)
      await cambiarEstado(tx, equipo.id, 'en_reparacion');
      estadoEquipo = 'en_reparacion';
    }
    return { incidencia, estadoEquipo };
  });
}
```

---

## 9. Modelo de datos

### 9.1 Relaciones

```text
salas 1 ──── N equipos 1 ──── N incidencias
tecnicos 1 ── N incidencias   (opcional, F5)

v_equipos = equipos + nombre de la sala + conteo de incidencias de los últimos 30 días
```

Las migraciones se guardan en `supabase/migrations/` y continúan la numeración existente (P00 la identifica). En este documento se nombran M1 y M2.

### 9.2 M1 · Tablas

```sql
-- M1: tablas de Soporte de Salas

CREATE TABLE IF NOT EXISTS salas (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(80)   NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT salas_nombre_minimo CHECK (char_length(btrim(nombre)) >= 1)   -- RN-12
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_salas_nombre ON salas (lower(btrim(nombre)));

CREATE TABLE IF NOT EXISTS equipos (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(40)   NOT NULL,
  sala_id     UUID          NOT NULL REFERENCES salas(id) ON DELETE RESTRICT,
  estado      VARCHAR(16)   NOT NULL DEFAULT 'funcional',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT equipos_codigo_unico  UNIQUE (codigo),                        -- RN-01
  CONSTRAINT equipos_codigo_minimo CHECK (char_length(btrim(codigo)) >= 1),-- RN-12
  CONSTRAINT equipos_estado_valido CHECK (estado IN ('funcional', 'en_reparacion', 'dado_de_baja'))  -- RN-07
);
CREATE INDEX IF NOT EXISTS idx_equipos_sala   ON equipos (sala_id);
CREATE INDEX IF NOT EXISTS idx_equipos_estado ON equipos (estado);

-- Secuencia para el número de caso legible (RN-05)
CREATE SEQUENCE IF NOT EXISTS seq_numero_caso START 1;

CREATE TABLE IF NOT EXISTS tecnicos (          -- usado por la funcionalidad opcional (F5)
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      VARCHAR(100)  NOT NULL,
  activo      BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT tecnicos_nombre_minimo CHECK (char_length(btrim(nombre)) >= 2)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tecnicos_nombre ON tecnicos (lower(btrim(nombre)));

CREATE TABLE IF NOT EXISTS incidencias (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_caso    VARCHAR(16)   NOT NULL,                 -- 'INC-0001' (RN-05)
  equipo_id      UUID          NOT NULL REFERENCES equipos(id) ON DELETE RESTRICT,   -- RN-15
  descripcion    TEXT          NOT NULL,
  estado         VARCHAR(12)   NOT NULL DEFAULT 'abierta',
  tecnico_id     UUID          REFERENCES tecnicos(id) ON DELETE SET NULL,           -- opcional (F5)
  fecha          DATE          NOT NULL,                 -- fecha de reporte (RN-04)
  fecha_estado   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),   -- último cambio de estado (para RN-10)
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT incidencias_numero_unico   UNIQUE (numero_caso),
  CONSTRAINT incidencias_desc_minima    CHECK (char_length(btrim(descripcion)) >= 3),  -- RN-13
  CONSTRAINT incidencias_estado_valido  CHECK (estado IN ('abierta', 'en_revision', 'cerrada'))
);
CREATE INDEX IF NOT EXISTS idx_incidencias_equipo ON incidencias (equipo_id, created_at DESC);  -- RN-14
CREATE INDEX IF NOT EXISTS idx_incidencias_fecha  ON incidencias (fecha);
CREATE INDEX IF NOT EXISTS idx_incidencias_estado ON incidencias (estado);

CREATE OR REPLACE FUNCTION ss_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_equipos_updated_at ON equipos;
CREATE TRIGGER trg_equipos_updated_at BEFORE UPDATE ON equipos
  FOR EACH ROW EXECUTE FUNCTION ss_actualizar_updated_at();
```

El número de caso se arma en el servidor como `'INC-' || LPAD(nextval('seq_numero_caso')::text, 4, '0')`, dentro de la misma transacción del reporte.

### 9.3 M2 · Vista de equipos y seguridad

```sql
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
```

Las tablas quedan sin políticas: la clave pública de Supabase no puede leerlas ni escribirlas. Todo el acceso ocurre en el servidor mediante la conexión directa a Postgres. El conteo de los últimos 30 días de la vista usa `CURRENT_DATE`; para la alerta oficial (F6) el conteo se recalcula con `hoyBogota()` en el servidor para no depender de la zona del servidor de base de datos.

### 9.4 Traducción de errores de la base de datos

| Código Postgres | Restricción | Código de negocio |
|---|---|---|
| `23505` | `equipos_codigo_unico` | `CODIGO_DUPLICADO` |
| `23505` | `ux_salas_nombre` | `SALA_DUPLICADA` |
| `23505` | `ux_tecnicos_nombre` | `TECNICO_DUPLICADO` |
| `23505` | `incidencias_numero_unico` | `ERROR_INTERNO` (la secuencia no debería repetir) |
| `23503` | llaves foráneas (`ON DELETE RESTRICT`) | `TIENE_DEPENDENCIAS` |
| `23514` | cualquier CHECK | `DATOS_INVALIDOS` |
| Otro | | `ERROR_INTERNO` (se registra en consola, no se muestra al usuario) |

---

## 10. Arquitectura del código

### 10.1 Capas

```text
Pantallas (app/soporte/*) ──┐
                            ├──► Rutas API (app/api/soporte/*) ──► lib/dataService.ts ──► lib/datos/* ──► Postgres
Componentes (components/*) ─┘          │                              │
                                       └──── lib/validacion (Zod)     └──── lib/reglas/* (funciones puras)
```

El plan funcional ya separaba datos (`modelos.py`), lógica (`sistema.py`) y web (`app.py`); esta arquitectura mantiene esa separación: `lib/datos/` es el equivalente de `modelos.py`, `lib/reglas/` el de la parte pura de `sistema.py`, y las rutas y páginas el de `app.py`.

- `lib/reglas/`: reglas puras (validación de código, descripción y estado; conteo de alertas; transición de incidencia). No importan `pg`, ni red, ni el reloj (salvo `fechas.ts`). Se prueban con Vitest.
- `lib/datos/`: consultas SQL y casos de uso con transacciones. Solo este directorio importa `lib/db/conexion.ts`.
- `lib/dataService.ts`: fachada única. Las rutas y páginas importan datos solo desde aquí.
- Rutas API: validan con Zod, verifican sesión, llaman a `dataService` y responden con `lib/http/respuestas.ts`.

### 10.2 Árbol de archivos nuevos

```text
.github/copilot-instructions.md
doc/ESTADO_ACTUAL.md
doc/ESTADO_EJECUCION.md
doc/checkpoints/FASE_N_COMPLETADA.md

supabase/migrations/NNNN_soporte_tablas.sql
supabase/migrations/NNNN_soporte_vista_seguridad.sql

scripts/migrar.mjs                 (solo si no existe mecanismo de migraciones)
scripts/verificar-bd.mjs
scripts/probar-flujo.ts
scripts/limpiar-prueba.mjs
scripts/cargar-demo.ts

lib/config/soporte.ts
lib/reglas/errores.ts
lib/reglas/fechas.ts
lib/reglas/equipo.ts
lib/reglas/incidencia.ts
lib/reglas/alertas.ts              (opcional, F6)
lib/validacion/esquemas.ts
lib/db/conexion.ts
lib/auth/sesion.ts
lib/http/respuestas.ts
lib/formato.ts
lib/datos/tipos.ts
lib/datos/salas.ts
lib/datos/equipos.ts
lib/datos/incidencias.ts
lib/datos/tecnicos.ts              (opcional, F5)
lib/dataService.ts

tests/reglas/ayudas.ts
tests/reglas/equipo.test.ts
tests/reglas/incidencia.test.ts
tests/reglas/alertas.test.ts       (F6)
vitest.config.ts

app/page.tsx                                  (redirige a /soporte)
app/soporte/layout.tsx
app/soporte/page.tsx                          (panel: salas y equipos)
app/soporte/salas/page.tsx
app/soporte/equipos/nuevo/page.tsx
app/soporte/equipos/[codigo]/page.tsx         (detalle + historial)
app/soporte/incidencias/page.tsx              (listado general)
app/soporte/tecnicos/page.tsx                 (opcional, F5)
app/soporte/alertas/page.tsx                  (opcional, F6)

app/api/soporte/sesion/route.ts
app/api/soporte/salas/route.ts
app/api/soporte/equipos/route.ts
app/api/soporte/equipos/[codigo]/route.ts
app/api/soporte/equipos/[codigo]/estado/route.ts
app/api/soporte/equipos/[codigo]/incidencias/route.ts
app/api/soporte/incidencias/route.ts
app/api/soporte/incidencias/[numero]/asignar/route.ts   (opcional, F5)
app/api/soporte/incidencias/[numero]/cerrar/route.ts
app/api/soporte/tecnicos/route.ts                        (opcional, F5)
app/api/soporte/alertas/route.ts                         (opcional, F6)

components/ui/Boton.tsx
components/ui/Campo.tsx
components/ui/Selector.tsx
components/ui/Tarjeta.tsx
components/ui/Insignia.tsx
components/ui/Aviso.tsx
components/ui/Modal.tsx
components/ui/EstadoVacio.tsx
components/soporte/NavegacionSoporte.tsx
components/soporte/InsigniaEstadoEquipo.tsx
components/soporte/InsigniaEstadoIncidencia.tsx
components/soporte/TablaEquipos.tsx
components/soporte/FiltrosEquipos.tsx
components/soporte/FormularioEquipo.tsx
components/soporte/FormularioSala.tsx
components/soporte/FormularioIncidencia.tsx
components/soporte/SelectorEstadoEquipo.tsx
components/soporte/HistorialIncidencias.tsx
components/soporte/FormularioTecnico.tsx       (opcional)
components/soporte/PanelAlertas.tsx            (opcional)
```

### 10.3 Responsabilidades y prohibiciones

| Regla de código | Motivo |
|---|---|
| Identificadores, comentarios y mensajes en español | Coherencia con el dominio |
| Las reglas puras viven en `lib/reglas/` y no tocan la base ni la red | Se prueban con Vitest; es la separación que el plan ya buscaba |
| Solo `lib/datos/` importa `lib/db/conexion.ts` | Las rutas no escriben SQL |
| Las rutas solo importan datos desde `lib/dataService.ts` | Fachada única |
| Toda ruta `/api/soporte/*` llama `exigirSesion()` como primera instrucción | Sección 1.3 |
| El número de caso y el cambio de estado del equipo al reportar ocurren en la misma transacción | RN-04 a RN-06 |
| El código del equipo y el nombre de la sala se normalizan antes de buscar o comparar | RN-01, RN-12 |
| Las fechas como texto `YYYY-MM-DD` entre capas; "hoy" solo con `hoyBogota()` | Sección 14 |
| `params` de rutas dinámicas se obtiene con `await params` | Next.js 15 y 16 entregan `params` como Promise |
| No modificar archivos del login salvo la redirección indicada en P03 | Sección 1.3 |

### 10.4 Configuración

```ts
// lib/config/soporte.ts
export const ESTADOS_EQUIPO = ['funcional', 'en_reparacion', 'dado_de_baja'] as const;
export const ESTADOS_INCIDENCIA = ['abierta', 'en_revision', 'cerrada'] as const;
export const DIAS_VENTANA_ALERTA = 30;          // RN-09
export const INCIDENCIAS_PARA_ALERTA = 3;       // RN-09
export const DIAS_REASIGNACION = 5;             // RN-10 (F5)
export const ZONA_HORARIA = 'America/Bogota';
export const LIMITE_LISTADO = 500;
```

### 10.5 Firmas de las reglas puras

```ts
// lib/reglas/errores.ts
export type CodigoError =
  | 'DATOS_INVALIDOS' | 'NO_AUTORIZADO'
  | 'SALA_DUPLICADA' | 'SALA_NO_ENCONTRADA'
  | 'CODIGO_DUPLICADO' | 'EQUIPO_NO_ENCONTRADO' | 'ESTADO_INVALIDO' | 'TIENE_DEPENDENCIAS'
  | 'INCIDENCIA_NO_ENCONTRADA' | 'INCIDENCIA_NO_ASIGNABLE'
  | 'TECNICO_DUPLICADO' | 'TECNICO_NO_ENCONTRADO' | 'ERROR_INTERNO';
export const MENSAJES: Record<CodigoError, string>;     // sección 11.2
export const ESTADO_HTTP: Record<CodigoError, number>;  // sección 11.2
export class ErrorDeNegocio extends Error {
  constructor(public codigo: CodigoError, mensaje?: string, public detalles?: unknown);
}

// lib/reglas/fechas.ts
export function hoyBogota(reloj?: Date): string;                 // 'YYYY-MM-DD'
export function diasEntre(desde: string, hasta: string): number; // hasta - desde
export function dentroDeVentana(fecha: string, hoy: string, dias: number): boolean;  // fecha >= hoy - dias

// lib/reglas/equipo.ts
export type EstadoEquipo = 'funcional' | 'en_reparacion' | 'dado_de_baja';
export const ETIQUETA_EQUIPO: Record<EstadoEquipo, string>;      // sección 6.1
export function normalizarCodigo(codigo: string): string;        // recorta; respeta mayúsculas
export function esEstadoEquipoValido(estado: string): estado is EstadoEquipo;  // RN-07
export function validarDatosEquipo(d: { codigo: string; sala: string }): void; // no vacíos (RN-12)

// lib/reglas/incidencia.ts
export type EstadoIncidencia = 'abierta' | 'en_revision' | 'cerrada';
export const ETIQUETA_INCIDENCIA: Record<EstadoIncidencia, string>;   // sección 6.2
export function validarDescripcion(descripcion: string): void;   // no vacía, min 3 (RN-13)
export function formatearNumeroCaso(n: number): string;          // 1 → 'INC-0001'
export function puedeAsignarse(estado: EstadoIncidencia): boolean; // solo 'abierta' (RN-11)

// lib/reglas/alertas.ts  (F6)
export function esCandidatoABaja(incidenciasEnVentana: number): boolean;  // >= INCIDENCIAS_PARA_ALERTA (RN-09)
```

### 10.6 Firmas de `dataService`

```ts
// Salas
listarSalas(): Promise<FilaSala[]>                              // con total de equipos
crearSala(nombre: string): Promise<{ id: string }>

// Equipos
listarEquipos(f?: { salaId?: string; estado?: EstadoEquipo; busqueda?: string }): Promise<FilaEquipo[]>
crearEquipo(d: { codigo: string; salaId: string }): Promise<{ id: string; codigo: string }>
obtenerEquipo(codigo: string): Promise<DetalleEquipo>          // datos + historial de incidencias
cambiarEstadoEquipo(codigo: string, estado: EstadoEquipo): Promise<void>   // RN-07

// Incidencias
reportarIncidencia(codigoEquipo: string, descripcion: string): Promise<ResultadoIncidencia>  // RN-04 a RN-06
listarIncidencias(f?: { estado?: EstadoIncidencia; equipoCodigo?: string }): Promise<FilaIncidencia[]>
historialDeEquipo(codigo: string): Promise<FilaIncidencia[]>   // RN-14
cerrarIncidencia(numeroCaso: string): Promise<void>

// Opcionales (F5, F6)
listarTecnicos(): Promise<FilaTecnico[]>
crearTecnico(nombre: string): Promise<{ id: string }>
asignarTecnico(numeroCaso: string, tecnicoId: string): Promise<void>      // RN-11
reasignarIncidenciasVencidas(): Promise<{ reasignadas: number }>          // RN-10
listarCandidatosABaja(): Promise<FilaCandidato[]>                          // RN-09
```

Tipos (`lib/datos/tipos.ts`): `FilaSala { id, nombre, totalEquipos }`; `FilaEquipo { codigo, sala, estado, incidencias30d }`; `DetalleEquipo { equipo, historial: FilaIncidencia[] }`; `FilaIncidencia { numeroCaso, equipoCodigo, descripcion, estado, fecha, tecnico }`; `ResultadoIncidencia { incidencia, estadoEquipo }`; `FilaCandidato { codigo, sala, incidencias30d }`.

### 10.7 Conexión y transacciones

```ts
// lib/db/conexion.ts
import { Pool, types, type PoolClient } from 'pg';

types.setTypeParser(1082, (v) => v);                 // DATE → 'YYYY-MM-DD'
types.setTypeParser(1114, (v) => v);                 // TIMESTAMP → texto
types.setTypeParser(1184, (v) => v);                 // TIMESTAMPTZ → texto
types.setTypeParser(20, (v) => parseInt(v, 10));     // BIGINT (COUNT) → number

const globalParaPool = globalThis as unknown as { poolSoporte?: Pool };

export const pool = globalParaPool.poolSoporte ?? new Pool({
  connectionString: process.env.DATABASE_URL,        // el nombre real lo confirma P00
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10_000,
});
if (process.env.NODE_ENV !== 'production') globalParaPool.poolSoporte = pool;

export async function consultar<T>(sql: string, valores: unknown[] = []): Promise<T[]> { /* pool.query */ }
export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> { /* BEGIN/COMMIT/ROLLBACK */ }
```

---

## 11. Contratos de API

### 11.1 Formato de respuesta

```json
{ "ok": true, "datos": { } }
```

```json
{ "ok": false, "error": { "codigo": "EQUIPO_NO_ENCONTRADO", "mensaje": "No existe un equipo con ese código.", "detalles": null } }
```

Todas las respuestas llevan `Cache-Control: no-store`.

### 11.2 Códigos de error

| Código | HTTP | Mensaje para el usuario |
|---|---|---|
| `DATOS_INVALIDOS` | 400 | Revise los datos ingresados. |
| `NO_AUTORIZADO` | 401 | Debe iniciar sesión. |
| `SALA_DUPLICADA` | 409 | Ya existe una sala con ese nombre. |
| `SALA_NO_ENCONTRADA` | 404 | La sala no existe. |
| `CODIGO_DUPLICADO` | 409 | Ya existe un equipo con ese código. |
| `EQUIPO_NO_ENCONTRADO` | 404 | No existe un equipo con ese código. |
| `ESTADO_INVALIDO` | 422 | El estado debe ser funcional, en reparación o dado de baja. |
| `TIENE_DEPENDENCIAS` | 409 | No se puede eliminar: tiene equipos o incidencias asociadas. |
| `INCIDENCIA_NO_ENCONTRADA` | 404 | La incidencia no existe. |
| `INCIDENCIA_NO_ASIGNABLE` | 409 | Solo se puede asignar una incidencia que esté abierta. |
| `TECNICO_DUPLICADO` | 409 | Ya existe un técnico con ese nombre. |
| `TECNICO_NO_ENCONTRADO` | 404 | El técnico no existe. |
| `ERROR_INTERNO` | 500 | Ocurrió un error inesperado. Intente de nuevo. |

### 11.3 Endpoints (todos requieren sesión)

| Método y ruta | Cuerpo o parámetros | Respuesta `datos` |
|---|---|---|
| `GET /api/soporte/sesion` | | `{ email }` |
| `GET /api/soporte/salas` | | `FilaSala[]` |
| `POST /api/soporte/salas` | `{ nombre }` | `{ id }` (201) |
| `GET /api/soporte/equipos?salaId=&estado=&busqueda=` | | `FilaEquipo[]` |
| `POST /api/soporte/equipos` | `{ codigo, salaId }` | `{ id, codigo }` (201) |
| `GET /api/soporte/equipos/[codigo]` | | `DetalleEquipo` |
| `PATCH /api/soporte/equipos/[codigo]/estado` | `{ estado }` | `{ actualizado: true }` |
| `GET /api/soporte/equipos/[codigo]/incidencias` | | `FilaIncidencia[]` |
| `POST /api/soporte/equipos/[codigo]/incidencias` | `{ descripcion }` | `ResultadoIncidencia` (201) |
| `GET /api/soporte/incidencias?estado=&equipoCodigo=` | | `FilaIncidencia[]` |
| `POST /api/soporte/incidencias/[numero]/cerrar` | | `{ cerrada: true }` |
| `POST /api/soporte/incidencias/[numero]/asignar` | `{ tecnicoId }` | `{ asignada: true }` (opcional, F5) |
| `GET /api/soporte/tecnicos` | | `FilaTecnico[]` (opcional, F5) |
| `POST /api/soporte/tecnicos` | `{ nombre }` | `{ id }` (opcional, F5) |
| `GET /api/soporte/alertas` | | `FilaCandidato[]` (opcional, F6) |

### 11.4 Esquemas Zod (`lib/validacion/esquemas.ts`)

| Esquema | Reglas |
|---|---|
| `esquemaSala` | nombre recortado, 1 a 80 |
| `esquemaEquipo` | codigo (1 a 40, recortado), salaId uuid |
| `esquemaEstadoEquipo` | estado enum de los tres estados |
| `esquemaIncidencia` | descripcion recortada, 3 a 1000 |
| `esquemaFiltrosEquipos` | salaId, estado, busqueda opcionales |
| `esquemaTecnico` | nombre recortado, 2 a 100 (F5) |
| `esquemaAsignar` | tecnicoId uuid (F5) |

---

## 12. Pantallas

El plan funcional tiene un `base.html` con menú y un panel principal. Se conserva esa idea: un layout común con navegación y un panel que muestra salas y equipos.

| Ruta | Contenido |
|---|---|
| `/` | Redirige a `/soporte`. |
| Layout `/soporte` | Verifica la sesión; sin sesión redirige al login. Barra con "Soporte de Salas", navegación (Panel, Incidencias, Salas; Técnicos y Alertas cuando estén activos), correo del usuario y botón de cerrar sesión. Menú desplegable en móvil. |
| `/soporte` · Panel | Resumen por sala: cada sala con su total de equipos y cuántos están funcionales, en reparación y dados de baja. `TablaEquipos` con filtros (`FiltrosEquipos`: por sala, por estado, búsqueda por código): código (enlace al detalle), sala, estado (`InsigniaEstadoEquipo`), y un `SelectorEstadoEquipo` para cambiarlo en línea. Botones "Registrar equipo" y "Registrar sala". Antes de una clase, esta vista responde "cuántos equipos están disponibles" (RF del plan). |
| `/soporte/salas` · Salas | `FormularioSala` y lista de salas con su total de equipos. Nombre duplicado muestra el mensaje de `SALA_DUPLICADA`. |
| `/soporte/equipos/nuevo` · Registrar equipo | `FormularioEquipo`: código y selector de sala. Al guardar, navega al detalle del equipo. Código duplicado muestra el mensaje. |
| `/soporte/equipos/[codigo]` · Detalle | Encabezado con el código, la sala y `InsigniaEstadoEquipo`. `SelectorEstadoEquipo` para cambiar el estado (los tres, sin secuencia). Botón "Reportar incidencia" que abre `FormularioIncidencia` (descripción); al reportar, el equipo pasa a "en reparación" (salvo baja) y la incidencia aparece arriba del historial. `HistorialIncidencias`: número de caso, fecha, descripción, estado (`InsigniaEstadoIncidencia`), técnico si lo tiene; de la más reciente a la más antigua (RN-14). Acción "Cerrar" en incidencias no cerradas. |
| `/soporte/incidencias` · Incidencias | Listado general de incidencias con filtros por estado y por equipo; número de caso, equipo, descripción, estado, fecha, técnico. Útil para ver todo lo abierto. |
| `/soporte/tecnicos` · Técnicos (opcional) | `FormularioTecnico` y lista de técnicos; desde el detalle de una incidencia abierta se asigna un técnico. |
| `/soporte/alertas` · Alertas (opcional) | `PanelAlertas` con los equipos candidatos a baja (3+ incidencias en 30 días), su sala y el conteo. |

### 12.1 Textos fijos

Confirmación de cambio a dado de baja:

> Vas a marcar el equipo {codigo} como dado de baja. Podrás reactivarlo cambiando su estado luego.

---

## 13. Identidad visual

| Token | Valor | Uso |
|---|---|---|
| `--color-primario` | `#245A8D` | Botones principales, barra superior |
| `--color-primario-suave` | `#E6EEF5` | Fondos de selección, hover |
| `--color-funcional` | `#2F7D4F` | Equipo funcional, incidencia cerrada |
| `--color-reparacion` | `#B7791F` | Equipo en reparación, incidencia abierta |
| `--color-baja` | `#B83232` | Equipo dado de baja, errores |
| `--color-revision` | `#245A8D` | Incidencia en revisión |
| `--color-fondo` | `#F5F6F8` | Fondo de página |
| `--color-superficie` | `#FFFFFF` | Tarjetas, tablas |
| `--color-texto` | `#1F2933` | Texto principal |
| `--color-texto-suave` | `#52606D` | Texto secundario |
| `--color-borde` | `#D9DEE4` | Bordes y divisores |

Los tokens se agregan a `app/globals.css` sin borrar estilos existentes. Con Tailwind 4 se declaran en `@theme`; con Tailwind 3, en `tailwind.config`.

Criterios: tipografía del proyecto (si no hay, Inter con `next/font`); el estado nunca se comunica solo con color (la insignia lleva texto); fechas con `Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' })` sobre fechas `YYYY-MM-DD`; bordes redondeados de 8 px; sin emojis; tablas convertidas en tarjetas apiladas en pantallas menores a 640 px.

---

## 14. Fechas y zona horaria

| Regla | Implementación |
|---|---|
| "Hoy" (fecha de la incidencia, ventana de 30 días) | Solo con `hoyBogota()` (`Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })`) |
| Fecha de la incidencia | Se asigna al reportar con `hoyBogota()` (RN-04) |
| Fechas entre capas | Texto `YYYY-MM-DD` |
| Lectura desde BD | Parsers de `pg` devuelven texto (sección 10.7) |
| Ventana de 30 días (alertas) | `dentroDeVentana(fecha, hoyBogota(), 30)` en el servidor; la vista usa `CURRENT_DATE` solo como apoyo de presentación |
| Reasignación tras 5 días (F5) | `diasEntre(fecha_estado, hoyBogota()) > 5` |

Vercel corre en UTC; Colombia es UTC-5 sin horario de verano. Por eso la fecha del reporte y las ventanas de días se calculan con `hoyBogota()` y no con la hora del servidor.

---

## 15. Seguridad e integridad

| Medida | Detalle |
|---|---|
| Cambio de la credencial expuesta | Obligatorio y previo (sección 2) |
| Acceso solo con sesión | Middleware o proxy existente y `exigirSesion()` en cada ruta de `/api/soporte` |
| Base de datos cerrada al público | RLS activo sin políticas y permisos revocados a `anon` y `authenticated` |
| Integridad del reporte | El número de caso, la incidencia y el cambio de estado del equipo ocurren en una transacción (sección 8.1) |
| Número de caso único | Secuencia de Postgres; `UNIQUE` en `numero_caso` |
| Equipos y salas no se borran si tienen dependencias | `ON DELETE RESTRICT`; un equipo se retira con el estado `dado_de_baja` (RN-15) |
| Validación en tres puntos | Formulario (Zod y reglas), API (Zod y reglas) y base (CHECK, UNIQUE, llaves foráneas) |
| SQL parametrizado | Ningún valor se concatena |
| Errores internos | Se registran con `console.error`; el usuario recibe `ERROR_INTERNO` sin detalles técnicos |

---

## 16. Pruebas

### 16.1 Pruebas unitarias de reglas (Vitest)

Fecha de referencia: `hoy = '2026-06-15'`.

| ID | Función | Entrada | Resultado esperado |
|---|---|---|---|
| T-01 | `normalizarCodigo` | " pc-sala1-03 " | "PC-SALA1-03" (recorta; conserva) — si decides respetar la grafía original, documenta; por defecto recorta y deja igual |
| T-02 | `validarDatosEquipo` | codigo " " | `DATOS_INVALIDOS` |
| T-03 | `validarDatosEquipo` | sala " " | `DATOS_INVALIDOS` |
| T-04 | `validarDatosEquipo` | codigo "PC-01", sala "Sala 1" | sin error |
| T-05 | `esEstadoEquipoValido` | "funcional" / "en_reparacion" / "dado_de_baja" | `true` en los tres |
| T-06 | `esEstadoEquipoValido` | "roto" | `false` |
| T-07 | `validarDescripcion` | "" | `DATOS_INVALIDOS` |
| T-08 | `validarDescripcion` | "ab" (2 caracteres) | `DATOS_INVALIDOS` |
| T-09 | `validarDescripcion` | "No enciende" | sin error |
| T-10 | `formatearNumeroCaso` | 1 | "INC-0001" |
| T-11 | `formatearNumeroCaso` | 42 | "INC-0042" |
| T-12 | `formatearNumeroCaso` | 1234 | "INC-1234" |
| T-13 | `puedeAsignarse` | "abierta" | `true` |
| T-14 | `puedeAsignarse` | "en_revision" / "cerrada" | `false` |
| T-15 | `dentroDeVentana` | fecha "2026-06-01", hoy "2026-06-15", 30 | `true` |
| T-16 | `dentroDeVentana` | fecha "2026-05-10", hoy "2026-06-15", 30 | `false` (36 días) |
| T-17 | `dentroDeVentana` | fecha "2026-05-16", hoy "2026-06-15", 30 | `true` (30 días exactos) |
| T-18 | `diasEntre` | "2026-06-10", "2026-06-15" | 5 |
| T-19 | `esCandidatoABaja` | 2 | `false` |
| T-20 | `esCandidatoABaja` | 3 | `true` (RN-09) |
| T-21 | `esCandidatoABaja` | 5 | `true` |

Comando: `npm test`. Las 21 pruebas deben pasar antes de continuar con la fase 3.

### 16.2 Prueba de flujo contra la base de datos

`scripts/probar-flujo.ts` (`npm run probar:flujo`) usa `dataService` con nombres `Prueba *` y códigos `PV-TEST-*`. Imprime `OK` o `FALLA` por paso y limpia al final.

| Paso | Operación | Esperado |
|---|---|---|
| 1 | Crear sala "Prueba Sala 1" | Creada |
| 2 | Crear "prueba sala 1" otra vez | `SALA_DUPLICADA` |
| 3 | Crear equipo "PV-TEST-01" en Prueba Sala 1 | Creado, funcional |
| 4 | Crear "PV-TEST-01" otra vez | `CODIGO_DUPLICADO` |
| 5 | Crear equipo en una sala inexistente | `SALA_NO_ENCONTRADA` |
| 6 | Reportar incidencia en "PV-TEST-01" ("No enciende") | Incidencia INC-xxxx abierta; el equipo pasa a en_reparacion |
| 7 | Reportar otra incidencia en "PV-TEST-01" ("Sin internet") | Segunda incidencia; ambas en el historial (RN-08) |
| 8 | Reportar incidencia con descripción "" | `DATOS_INVALIDOS` |
| 9 | Reportar incidencia en un equipo inexistente | `EQUIPO_NO_ENCONTRADO` |
| 10 | Cambiar "PV-TEST-01" a funcional | Estado funcional (sin secuencia, RN-07) |
| 11 | Cambiar "PV-TEST-01" a un estado inválido | `ESTADO_INVALIDO` |
| 12 | Historial de "PV-TEST-01" | 2 incidencias, la más reciente primero (RN-14) |
| 13 | Cambiar "PV-TEST-01" a dado_de_baja; reportar una incidencia | La incidencia se crea pero el equipo sigue dado_de_baja (RN-06, sección 4.4) |
| 14 | Cerrar la primera incidencia | Estado cerrada |

### 16.3 Aceptación (criterio de terminado)

Se ejecuta en el despliegue de Vercel y se documenta en `doc/ACEPTACION.md`.

| ID | Acción | Resultado esperado |
|---|---|---|
| A-01 | Abrir `/soporte` sin sesión | Redirección al login |
| A-02 | Crear la sala "Sala 1" y la sala "Sala 2" | Aparecen con 0 equipos |
| A-03 | Registrar "PC-SALA1-01" y "PC-SALA1-02" en Sala 1 | Aparecen como funcionales; Sala 1 muestra 2 equipos |
| A-04 | Registrar "PC-SALA1-01" otra vez | Rechazo por código duplicado |
| A-05 | Reportar "No enciende" en "PC-SALA1-01" | Incidencia con número de caso; el equipo pasa a "En reparación" |
| A-06 | Reportar una segunda incidencia en el mismo equipo | Se permite; ambas en el historial |
| A-07 | Ver el historial de "PC-SALA1-01" | Dos incidencias, la más reciente primero |
| A-08 | Cambiar "PC-SALA1-01" a "Funcional" | Estado actualizado sin exigir cerrar la incidencia |
| A-09 | Cambiar "PC-SALA1-02" a "Dado de baja" | Estado actualizado (con confirmación) |
| A-10 | En el panel, filtrar por estado "Funcional" | Muestra solo los funcionales |
| A-11 | En el panel, ver el resumen de Sala 1 | Cuántos funcionales, en reparación y dados de baja |
| A-12 | Reportar con descripción vacía | Rechazo con mensaje |
| A-13 | Cerrar una incidencia | Pasa a "Cerrada" |
| A-14 | Cerrar el navegador y volver a entrar | Los datos persisten (base de datos, no JSON) |
| A-15 | (Opcional) Registrar un técnico y asignarlo a una incidencia abierta | La incidencia pasa a "En revisión" con el técnico |
| A-16 | (Opcional) Generar 3 incidencias en un equipo y ver alertas | El equipo aparece como candidato a baja |

A-15 y A-16 corresponden a las funcionalidades opcionales; se verifican tras P09.

---

## 17. Plan de ejecución

| Fase | Prompt | Resultado | Cierre |
|---|---|---|---|
| 0 · Preparación | P00 | Credencial cambiada; `ESTADO_ACTUAL.md`, `copilot-instructions.md`, `ESTADO_EJECUCION.md`; compilación de base | `FASE_0_COMPLETADA.md` |
| 1 · Base de datos | P01 | M1 y M2 aplicadas; `npm run db:verificar` sin fallas | `FASE_1_COMPLETADA.md` |
| 2 · Reglas | P02 | `lib/config`, `lib/reglas`, 21 pruebas en verde | `FASE_2_COMPLETADA.md` |
| 3 · Servidor | P03 | Conexión, sesión, respuestas, esquemas, formato; `/api/soporte/sesion` protegido | `FASE_3_COMPLETADA.md` |
| 4 · Datos y API | P04, P05 | `lib/datos/*`, `dataService`, rutas; `npm run probar:flujo` sin fallas | `FASE_4_COMPLETADA.md` |
| 5 · Interfaz | P06, P07, P08 | Componentes base, panel, salas, equipos, cambio de estado, reporte e historial | `FASE_5_COMPLETADA.md` |
| 6 · Aceptación | (en P08) | `ACEPTACION.md` con A-01 a A-14; README | `FASE_6_COMPLETADA.md` |
| 7 · Opcionales | P09 | Técnicos, asignación, reasignación y alertas | `FASE_7_COMPLETADA.md` |

Condiciones entre fases: no se inicia una fase sin el archivo de cierre de la anterior; `npm run build` sin errores al final de cada prompt; `npm test` en verde desde P02; cada prompt termina con commit y push, y un fallo de despliegue en Vercel se corrige antes del siguiente prompt.

---

## 18. Funcionalidades opcionales

Se construyen solo con la fase 6 cerrada.

| Prompt | Funcionalidad | Implementación |
|---|---|---|
| P09 | F5 · Técnicos y asignación | `lib/datos/tecnicos.ts` (crear y listar); `asignarTecnico(numeroCaso, tecnicoId)`: la incidencia debe estar `abierta` (puedeAsignarse, RN-11), pasa a `en_revision` con el técnico y actualiza `fecha_estado`. `cerrarIncidencia` también actualiza `fecha_estado`. Rutas `/api/soporte/tecnicos` y `/api/soporte/incidencias/[numero]/asignar`; pantalla `/soporte/tecnicos` y el botón de asignar en el detalle de la incidencia |
| P09 | F5 · Reasignación automática (RN-10) | `reasignarIncidenciasVencidas()`: las incidencias en `en_revision` con `diasEntre(fecha_estado, hoyBogota()) > DIAS_REASIGNACION` se reasignan a otro técnico activo (por ejemplo, el que tenga menos casos activos) y se actualiza `fecha_estado`. Se invoca desde una ruta protegida o un Vercel Cron (con `CRON_SECRET`); se documenta cuál |
| P09 | F6 · Alertas de candidatos a baja (RN-09) | `lib/reglas/alertas.ts` `esCandidatoABaja` (pruebas T-19 a T-21); `listarCandidatosABaja()` cuenta, por equipo, las incidencias con `fecha` dentro de la ventana de 30 días (con `hoyBogota()`) y devuelve los que llegan a `INCIDENCIAS_PARA_ALERTA`. Ruta `/api/soporte/alertas` y pantalla `/soporte/alertas`; además, un aviso en el panel si hay candidatos |

---

## 19. Glosario

| Término | Definición |
|---|---|
| Sala | Espacio con varios equipos de cómputo |
| Equipo | Computador identificado por un código único, ubicado en una sala |
| Incidencia | Reporte de una falla de un equipo, con número de caso, descripción, fecha y estado |
| Número de caso | Identificador legible y consecutivo de una incidencia (INC-0001) |
| Estado del equipo | Funcional, en reparación o dado de baja |
| Estado de la incidencia | Abierta, en revisión o cerrada |
| Candidato a baja | Equipo con 3 o más incidencias en los últimos 30 días |
| Historial | Todas las incidencias de un equipo, de la más reciente a la más antigua |
| Regla pura | Función de `lib/reglas/` que solo depende de sus parámetros |
| Transacción | Conjunto de escrituras que se confirma completo o se revierte completo |
| Copilot en modo Agente | Modo de GitHub Copilot Chat que lee el repositorio, edita varios archivos y ejecuta comandos de terminal con aprobación |

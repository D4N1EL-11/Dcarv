# Soporte de Salas · Prompts para GitHub Copilot

> Plan de referencia: `doc/PLAN_SOPORTE_SALAS.md`
> Herramienta: GitHub Copilot Chat en modo Agente (VS Code)
> Punto de partida: proyecto desplegado en Vercel, Supabase conectado y login funcionando

---

## Antes de empezar: seguridad

El plan funcional traía un correo y una contraseña reales. Antes de P00: cambiar esa contraseña en el sistema de login, confirmar que `.env.local` está en `.gitignore` y no volver a pegar credenciales en la entrega. No continuar sin hacerlo.

## Cómo ejecutar estos prompts

1. Crear la carpeta `doc/` en la raíz del repositorio (si no existe) y copiar allí `PLAN_SOPORTE_SALAS.md` y `PROMPTS_SOPORTE_SALAS.md`.
2. Abrir el proyecto en VS Code y abrir Copilot Chat. En el selector de modo elegir **Agent**. En el selector de modelo elegir el más capaz disponible.
3. Cada prompt se ejecuta en una **conversación nueva** (botón `+` del chat).
4. Copiar el bloque gris completo del prompt, pegarlo en el chat y enviarlo. No hay datos que reemplazar.
5. Cuando Copilot pida permiso para ejecutar un comando en la terminal, leerlo y aceptarlo.
6. Al terminar cada prompt: revisar los cambios y aceptarlos (**Keep**); hacer la verificación indicada; hacer commit con el mensaje sugerido y `git push`. Vercel desplegará; si falla, usar el prompt de despliegue fallido antes de continuar.
7. No saltar prompts. Si algo falla, usar el prompt de corrección del final.

| Fase | Prompts |
|---|---|
| 0 · Preparación | P00 |
| 1 · Base de datos | P01 |
| 2 · Reglas de negocio | P02 |
| 3 · Servidor | P03 |
| 4 · Datos y API | P04, P05 |
| 5 · Interfaz | P06, P07, P08 |
| 7 · Opcionales | P09 |

---

## P00 · Auditoría del repositorio y archivos de control

**Fase:** 0 · **Modifica código:** no · **Crea:** `doc/ESTADO_ACTUAL.md`, `.github/copilot-instructions.md`, `doc/ESTADO_EJECUCION.md`, `doc/checkpoints/FASE_0_COMPLETADA.md`

````text
Actúa como ingeniero de software senior trabajando en modo agente sobre este repositorio Next.js.

Contexto: el proyecto "Soporte de Salas" (control de calidad y soporte técnico de las salas de cómputo: inventario de equipos, reporte de incidencias, estados e historial) ya está desplegado en Vercel, conectado a Supabase y tiene login funcionando. El plan técnico está en doc/PLAN_SOPORTE_SALAS.md. Este prompt NO implementa funcionalidades: audita el repositorio y crea los archivos de control.

Lee completo doc/PLAN_SOPORTE_SALAS.md, en especial las secciones 0, 1, 2, 3 y 17.

TAREA 1. Crea doc/ESTADO_ACTUAL.md con estas secciones, llenas con lo que encuentres. No supongas: si algo no existe, escribe "No existe".
1. Versiones (package.json): next, react, typescript, tailwindcss, pg, zod, @supabase/supabase-js, vitest.
2. Scripts de package.json.
3. Estructura: árbol de app/, lib/, components/, supabase/ y scripts/ hasta 3 niveles. Indica si usa carpeta src/.
4. Alias de importación en tsconfig.json.
5. Autenticación: archivos; mecanismo; función que lee la sesión y qué devuelve; ruta de la página de login; ruta a la que redirige después del login (archivo y línea); archivo de middleware o proxy y su matcher; cómo se cierra sesión.
6. Acceso a datos: clientes de Supabase existentes, uso del paquete pg, archivo de pool si existe.
7. Migraciones: carpeta, archivos existentes y su numeración, tabla de control, script o página que las aplica.
8. Variables de entorno: solo los NOMBRES presentes en .env.local y .env.example (NUNCA copies valores). Indica si existe una cadena de conexión directa a Postgres (DATABASE_URL o similar) y con qué nombre.
9. Estilos: versión de Tailwind, ubicación de globals.css, fuentes, tokens de color existentes, librería de íconos.
10. Pruebas: framework existente.
11. Conflictos con el plan: existencia previa de app/soporte, app/api/soporte, lib/dataService.ts y components/ui; contenido de app/page.tsx; tablas existentes llamadas salas, equipos, incidencias o tecnicos y, si existen, sus columnas.
12. Decisiones derivadas:
    - Ruta de la página de login.
    - Archivo de protección de rutas (proxy.ts en Next.js 16, middleware.ts antes) y si ya existe.
    - Mecanismo de migraciones a usar.
    - Nombre de la variable de conexión a Postgres que usará conexion.ts.
    - Nombres exactos que tendrán M1 y M2 continuando la numeración existente.
    - Prefijo de imports para lib.
13. Compilación de base: resultado de npm run build (TAREA 4).

TAREA 2. Crea .github/copilot-instructions.md reemplazando [AJUSTAR] con lo hallado:

```markdown
# Soporte de Salas · Instrucciones para Copilot

## Documentos rectores
- Plan técnico: doc/PLAN_SOPORTE_SALAS.md. Si una instrucción contradice el plan, prevalece el plan.
- Estado real del repositorio: doc/ESTADO_ACTUAL.md.
- Avance: doc/ESTADO_EJECUCION.md. Se actualiza al final de cada tarea.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS. Despliegue en Vercel.
- Postgres de Supabase con el paquete pg y la variable [AJUSTAR: variable de conexión].
- Validación con Zod. Pruebas con Vitest.
- Login existente: [AJUSTAR]. No se reescribe. Puerta única, sin roles.

## Convenciones
- Identificadores, comentarios, mensajes y textos de interfaz en español.
- Reglas de negocio solo en lib/reglas/: funciones puras, sin pg, sin red, sin variables de entorno y sin reloj (excepto fechas.ts). Se prueban con Vitest.
- Solo lib/datos/ importa lib/db/conexion.ts. Rutas y páginas importan datos únicamente desde lib/dataService.ts.
- Toda ruta en app/api/soporte/ llama await exigirSesion() como primera instrucción.
- Al reportar una incidencia, el número de caso, la incidencia y el cambio del equipo a en_reparacion ocurren en una sola transacción. Un equipo dado_de_baja no pasa a en_reparacion por un reporte.
- El estado del equipo puede cambiar a cualquiera de los tres sin secuencia obligatoria.
- Entradas validadas con los esquemas de lib/validacion/esquemas.ts.
- Errores de negocio con ErrorDeNegocio(codigo); respuestas con lib/http/respuestas.ts.
- El código del equipo y el nombre de la sala se normalizan antes de buscar o comparar.
- Fechas 'YYYY-MM-DD' como texto entre capas. Zona horaria America/Bogota; "hoy" solo con hoyBogota(); las ventanas de días (30, 5) se calculan con hoyBogota().
- En rutas dinámicas params es una Promise: const { codigo } = await params.
- SQL siempre con parámetros ($1, $2). Nunca concatenar valores.
- Un equipo no se elimina; se usa el estado dado_de_baja. Las incidencias no se borran.
- No instalar librerías de componentes (shadcn, MUI u otras). Usar components/ui/.
- Prefijo de imports para lib: [AJUSTAR].
- Archivo de protección de rutas: [AJUSTAR]. Ruta de login: [AJUSTAR].

## Al terminar cada tarea
1. npm run build sin errores.
2. npm test sin fallas (desde que exista Vitest).
3. Actualizar doc/ESTADO_EJECUCION.md.
4. No hacer commit: el estudiante revisa y hace el commit.
```

TAREA 3. Crea doc/ESTADO_EJECUCION.md:

```markdown
# Estado de ejecución · Soporte de Salas

| Prompt | Estado | Build | Tests | Fecha de cierre |
|---|---|---|---|---|
| P00 Auditoría | pendiente | | | |
| P01 Base de datos | pendiente | | | |
| P02 Reglas de negocio | pendiente | | | |
| P03 Servidor | pendiente | | | |
| P04 Datos | pendiente | | | |
| P05 API | pendiente | | | |
| P06 Interfaz base, panel y salas | pendiente | | | |
| P07 Equipos y cambio de estado | pendiente | | | |
| P08 Incidencias, historial y aceptación | pendiente | | | |
| P09 Opcionales: técnicos y alertas | pendiente | | | |

## Bitácora

Cada prompt agrega una sección con: archivos creados, archivos modificados, comandos ejecutados y su resultado, problemas y cómo se resolvieron, pendientes.
```

TAREA 4. Si no existe node_modules, ejecuta npm install. Luego npm run build y registra el resultado en la sección 13 de ESTADO_ACTUAL.md. Si falla, NO corrijas: describe el error.

TAREA 5. Confírmame que la credencial del plan funcional debe haberse cambiado (sección 2 del plan). Si la variable de conexión directa a Postgres no existe en .env.local, explícame cómo obtenerla en Supabase (Connect, Transaction pooler, puerto 6543) y agregarla a .env.local y a Vercel. No continuar con P01 sin ella.

RESTRICCIONES: no modifiques código, configuración ni dependencias. Solo crea los archivos de este prompt.

AL TERMINAR:
- Crea doc/checkpoints/FASE_0_COMPLETADA.md con: resultado de la compilación, existencia de la variable de conexión, mecanismo de login, decisiones derivadas.
- Marca P00 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y los riesgos para los siguientes prompts.
````

**Verificación del estudiante:** abrir `doc/ESTADO_ACTUAL.md` y confirmar que la sección 5 describe el login real y que la 8 identifica la variable de conexión a Postgres.

**Commit sugerido:** `docs: auditoría del repositorio y archivos de control para Copilot`

---

## P01 · Base de datos del módulo

**Fase:** 1 · **Crea:** dos migraciones, `scripts/verificar-bd.mjs` y, si hace falta, `scripts/migrar.mjs`

````text
Antes de escribir código lee completos: doc/PLAN_SOPORTE_SALAS.md (secciones 6, 9 y 15), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: crear y aplicar las dos migraciones y dejar un script que demuestre que la base protege las reglas (código único, estados válidos, número de caso por secuencia).

TAREA 1. Si ESTADO_ACTUAL.md reporta tablas previas con esos nombres que NO correspondan a este plan, detente y avísame. Si no, crea en supabase/migrations/ dos archivos con los nombres de la sección 12 de ESTADO_ACTUAL.md:
- M1 (tablas y secuencia) con el SQL exacto de la sección 9.2 del plan (incluye CREATE SEQUENCE seq_numero_caso).
- M2 (vista y seguridad) con el SQL exacto de la sección 9.3.
No cambies nombres de tablas, columnas, la secuencia ni las restricciones: el código depende de ellos (sección 9.4).

TAREA 2. Aplica las migraciones con el mecanismo existente o creando scripts/migrar.mjs (lee la variable de conexión; ssl { rejectUnauthorized: false }; tabla _migrations; aplica en orden alfabético en transacción; imprime "aplicada"/"omitida"; código 1 si falla) y el script "db:migrar". Si hay migraciones anteriores ya aplicadas por otro medio, regístralas sin ejecutarlas y explícalo.

TAREA 3. Crea scripts/verificar-bd.mjs y "db:verificar". Debe imprimir:
1. Existencia de salas, equipos, incidencias, tecnicos, la secuencia seq_numero_caso y la vista v_equipos.
2. Número de filas de cada tabla.
3. Restricciones (pg_constraint) e índices únicos: equipos_codigo_unico, ux_salas_nombre, incidencias_numero_unico.
4. Si RLS está activo en las cuatro tablas.
5. Pruebas de integridad en UNA transacción que SIEMPRE termina en ROLLBACK, con SAVEPOINT antes de cada caso que debe fallar:
   a) Insertar sala "Verif Sala"; insertar "verif sala" (minúscula): la segunda debe fallar con 23505 (ux_salas_nombre).
   b) Insertar equipo "VERIF-01" en la sala: funciona, estado funcional por defecto.
   c) Insertar "VERIF-01" otra vez: 23505 (equipos_codigo_unico).
   d) Insertar equipo con estado 'roto': 23514 (equipos_estado_valido).
   e) Insertar una incidencia para "VERIF-01" con numero_caso = 'INC-' || LPAD(nextval('seq_numero_caso')::text,4,'0'), descripcion "No enciende", estado 'abierta', fecha de hoy: funciona; comprobar que el numero_caso tiene el formato INC-0001 (o el siguiente).
   f) Insertar incidencia con descripcion 'ab' (2 caracteres): 23514 (incidencias_desc_minima).
   g) Insertar incidencia con estado 'pendiente': 23514 (incidencias_estado_valido).
   Imprime "OK" o "FALLA" por caso.
6. Total de fallas; termina con código 1 si hubo alguna.

Ejecuta npm run db:verificar y copia la salida en la bitácora.

RESTRICCIONES: no modifiques archivos del login ni de app/. No crees tablas distintas a las del plan.

AL TERMINAR:
- npm run build sin errores.
- Crea doc/checkpoints/FASE_1_COMPLETADA.md con la salida de npm run db:verificar.
- Marca P01 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** en Supabase, Table Editor, deben aparecer `salas`, `equipos`, `incidencias` y `tecnicos`. La salida de `npm run db:verificar` no debe tener FALLA, y el caso e debe mostrar un número de caso con formato INC-XXXX.

**Commit sugerido:** `feat(bd): tablas, secuencia de casos, vista y restricciones`

---

## P02 · Reglas de negocio y pruebas unitarias

**Fase:** 2 · **Crea:** `lib/config/soporte.ts`, `lib/reglas/*`, `tests/reglas/*`, `vitest.config.ts`

````text
Antes de escribir código lee completos: doc/PLAN_SOPORTE_SALAS.md (secciones 6, 7, 10.3, 10.4, 10.5, 11.2, 14 y 16.1), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md.

OBJETIVO: implementar las reglas puras y probarlas con Vitest. Incluye las reglas de las opcionales (alertas), porque son puras.

TAREA 1. Instala vitest (desarrollo). Agrega "test": "vitest run" y "test:ver": "vitest". Crea vitest.config.ts con environment 'node', include ['tests/**/*.test.ts'] y el alias '@' de tsconfig.json.

TAREA 2. Crea lib/config/soporte.ts con el contenido exacto de la sección 10.4.

TAREA 3. Crea lib/reglas/ con las firmas exactas de la sección 10.5:
- errores.ts: CodigoError; MENSAJES y ESTADO_HTTP con la tabla 11.2; clase ErrorDeNegocio.
- fechas.ts: hoyBogota; diasEntre(desde, hasta) (con Date.UTC); dentroDeVentana(fecha, hoy, dias) (diasEntre(fecha, hoy) <= dias).
- equipo.ts: EstadoEquipo; ETIQUETA_EQUIPO (Funcional / En reparación / Dado de baja); normalizarCodigo (recorta; conserva el valor); esEstadoEquipoValido (uno de los tres); validarDatosEquipo({ codigo, sala }) (no vacíos → DATOS_INVALIDOS).
- incidencia.ts: EstadoIncidencia; ETIQUETA_INCIDENCIA (Abierta / En revisión / Cerrada); validarDescripcion (recortada, mínimo 3 → DATOS_INVALIDOS); formatearNumeroCaso(n) ('INC-' + n con 4 dígitos mínimo, padStart(4,'0')); puedeAsignarse(estado) (solo 'abierta').
- alertas.ts: esCandidatoABaja(incidenciasEnVentana) (>= INCIDENCIAS_PARA_ALERTA).

Ninguna regla importa pg, red, next ni process.env, ni llama new Date() (excepto el parámetro por defecto de hoyBogota).

TAREA 4. Crea tests/reglas/ayudas.ts con esperarCodigo(fn, codigo).

TAREA 5. Crea las pruebas en tests/reglas/ (equipo, incidencia, alertas) cubriendo T-01 a T-21 de la sección 16.1. Cada caso con su ID. Para T-10 a T-12 comprueba el formato del número de caso (INC-0001, INC-0042, INC-1234); para T-15 a T-17, la ventana de 30 días (30 días exactos cuentan como dentro); para T-19 a T-21, el umbral de 3.

TAREA 6. Ejecuta npm test hasta que pasen las 21. Si una falla, corrige la regla, no la prueba, salvo que contradiga el plan; explícalo.

RESTRICCIONES: no toques app/, el login ni la base de datos.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_2_COMPLETADA.md con la salida resumida de npm test.
- Marca P02 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm test` (21 pruebas). Abrir `lib/reglas/incidencia.ts` y comprobar el formato del número de caso.

**Commit sugerido:** `feat(reglas): estados, número de caso y alertas con 21 pruebas`

---

## P03 · Infraestructura del servidor

**Fase:** 3 · **Crea:** conexión, sesión, respuestas, esquemas, formato y `/api/soporte/sesion` · **Modifica:** protección de rutas y redirección del login

````text
Antes de escribir código lee completos: doc/PLAN_SOPORTE_SALAS.md (secciones 1.3, 9.4, 10.1, 10.3, 10.7, 11.1, 11.2, 11.4, 13 y 14), doc/ESTADO_ACTUAL.md (sección 5) y doc/ESTADO_EJECUCION.md.

OBJETIVO: dejar lista la infraestructura del servidor.

TAREA 1. lib/db/conexion.ts como la sección 10.7. Usa el nombre real de la variable de conexión. Si ya hay pool, reutilízalo agregando los parsers.

TAREA 2. lib/auth/sesion.ts: obtenerSesion() (del login; devuelve { email } o null) y exigirSesion() (lanza NO_AUTORIZADO si no hay). Solo importa funciones del login; no modifica sus archivos.

TAREA 3. Protección de rutas en el archivo indicado: agrega /soporte/:path* y /api/soporte/:path* al matcher, conservando lo existente. Sin sesión: las páginas redirigen al login; las rutas /api/soporte responden 401 con el formato de la sección 11.1. Si no es posible en ese archivo, protege en el layout de /soporte (P06) y en exigirSesion(), y anótalo.

TAREA 4. Cambia SOLO el destino de la redirección posterior al login a /soporte.

TAREA 5. lib/http/respuestas.ts: responderOk; responderError (ErrorDeNegocio → ESTADO_HTTP; ZodError → 400 DATOS_INVALIDOS con flatten; pg 23505/23503/23514 → tabla 9.4 por error.constraint; otro → console.error y 500 ERROR_INTERNO); conManejoDeErrores; leerCuerpo. Todas con Cache-Control: no-store.

TAREA 6. lib/validacion/esquemas.ts con los esquemas de la sección 11.4, con tipos z.infer. No importa nada del servidor.

TAREA 7. lib/formato.ts: formatearFecha (Intl es-CO, dateStyle medium, timeZone UTC); etiquetas de estado reutilizando ETIQUETA_EQUIPO y ETIQUETA_INCIDENCIA de las reglas.

TAREA 8. app/api/soporte/sesion/route.ts: GET con conManejoDeErrores; primera instrucción await exigirSesion(); responde { email }. export const dynamic = 'force-dynamic'.

VERIFICACIÓN: npm run build y npm test. Inicia npm run dev; sin sesión, GET /api/soporte/sesion da 401. Pídeme que inicie sesión y abra http://localhost:3000/api/soporte/sesion; espera mi confirmación de 200. Comprueba que el login redirige a /soporte (puede mostrar 404 hasta P06).

AL TERMINAR:
- Crea doc/checkpoints/FASE_3_COMPLETADA.md con los resultados y el diff resumido de lo que tocaste del login o la protección.
- Marca P03 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `/api/soporte/sesion` da 401 sin sesión y 200 con sesión; el login lleva a `/soporte`.

**Commit sugerido:** `feat(servidor): conexión, sesión y utilidades de API`

---

## P04 · Datos: salas, equipos e incidencias

**Fase:** 4 (primera parte) · **Crea:** `lib/datos/*`, `lib/dataService.ts`, `scripts/limpiar-prueba.mjs`, `scripts/probar-flujo.ts`, `scripts/cargar-demo.ts`

````text
Antes de escribir código lee completos: doc/PLAN_SOPORTE_SALAS.md (secciones 6, 7, 8, 8.1, 9.4, 10.5, 10.6 y 16.2), doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Revisa lib/reglas/, lib/db/conexion.ts y lib/validacion/esquemas.ts.

OBJETIVO: implementar el acceso a datos y los casos de uso del módulo mínimo, con transacciones, y comprobar el flujo contra la base. El punto clave es el reporte de incidencia (número de caso + cambio de estado en una transacción).

TAREA 1. lib/datos/tipos.ts con los tipos de la sección 10.6 (FilaSala, FilaEquipo, DetalleEquipo, FilaIncidencia, ResultadoIncidencia, FilaCandidato, y para opcionales FilaTecnico). Reutiliza EstadoEquipo y EstadoIncidencia de lib/reglas.

TAREA 2. lib/datos/salas.ts:
- listarSalas(): salas con su total de equipos (COUNT); orden por nombre.
- crearSala(nombre): valida no vacío; inserta; SALA_DUPLICADA si choca.
- obtenerSalaActiva(tx, salaId) (interna): SALA_NO_ENCONTRADA si no existe.

TAREA 3. lib/datos/equipos.ts:
- listarEquipos({ salaId, estado, busqueda }): desde v_equipos; filtros por sala, estado y código (normalizado, LIKE); orden por código; incluye sala_nombre e incidencias_30d.
- crearEquipo({ codigo, salaId }): validarDatosEquipo; verifica la sala; inserta con estado funcional (RN-02); CODIGO_DUPLICADO si choca.
- obtenerEquipo(codigo): el equipo (v_equipos) con su historial (historialDeEquipo); EQUIPO_NO_ENCONTRADO si no existe.
- cambiarEstadoEquipo(codigo, estado): esEstadoEquipoValido (si no, ESTADO_INVALIDO); UPDATE; RN-07 (sin secuencia).
- obtenerEquipoPorCodigo(tx, codigo) (interna): para el reporte; EQUIPO_NO_ENCONTRADO si no.

TAREA 4. lib/datos/incidencias.ts:
- reportarIncidencia(codigoEquipo, descripcion): secuencia EXACTA de la sección 8.1 (validarDescripcion; obtenerEquipoPorCodigo; insertar incidencia con numero_caso desde la secuencia —INSERT ... numero_caso = 'INC-' || LPAD(nextval('seq_numero_caso')::text,4,'0')—, estado 'abierta', fecha hoyBogota(); si el equipo no está dado_de_baja, cambiarlo a en_reparacion, RN-06). Devuelve ResultadoIncidencia { incidencia, estadoEquipo }.
- historialDeEquipo(codigo): incidencias del equipo ordenadas por created_at descendente (RN-14), con número de caso, fecha, descripción, estado y técnico (nombre o null).
- listarIncidencias({ estado, equipoCodigo }): listado general con los mismos campos.
- cerrarIncidencia(numeroCaso): INCIDENCIA_NO_ENCONTRADA si no existe; UPDATE estado 'cerrada' y fecha_estado NOW().

TAREA 5. lib/datos/tecnicos.ts: créalo preparado para la funcionalidad opcional (F5); en el mínimo puede quedar con funciones que lanzan un error claro o sin exportar. No se usa aún.

TAREA 6. lib/dataService.ts como fachada: reexporta las funciones públicas del módulo mínimo y los tipos. Verifica que ningún archivo fuera de lib/datos importe lib/db/conexion.ts.

TAREA 7. scripts/limpiar-prueba.mjs con "db:limpiar": borra (en orden incidencias, equipos, salas) los registros de prueba: salas cuyo nombre empiece por 'Prueba' o 'Demo', sus equipos y las incidencias de esos equipos. Imprime el conteo. Opciones --prueba y --demo.

TAREA 8. Instala tsx (desarrollo). Crea scripts/probar-flujo.ts con los 14 pasos de la sección 16.2 usando solo dataService. Imprime OK/FALLA por paso; para los pasos que esperan error, verifica el código; limpia antes y en finally; cierra el pool; código 1 si hay fallas. "probar:flujo": "tsx --env-file=.env.local scripts/probar-flujo.ts" (o la variante con --import tsx). CRÍTICO: el paso 13 debe comprobar que, al reportar sobre un equipo dado_de_baja, la incidencia se crea pero el equipo sigue dado_de_baja. Ejecuta y corrige hasta 0 fallas.

TAREA 9. scripts/cargar-demo.ts con "db:demo": crea 2 salas, ~6 equipos repartidos, y reporta algunas incidencias (incluyendo un equipo con 3 incidencias recientes para que sea candidato a baja al probar las alertas). Limpia los demo antes. Imprime una tabla con sala, código y estado. Ejecútalo.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P04 en ESTADO_EJECUCION.md y agrega la salida de probar:flujo y db:demo en la bitácora. La fase 4 sigue abierta hasta P05.
- Muéstrame un resumen.
````

**Verificación del estudiante:** `npm run probar:flujo` (14 OK, 0 fallas); el paso 6 confirma el cambio automático a "en reparación" y el 13 el caso del equipo dado de baja. `npm run db:demo` y revisar en Supabase.

**Commit sugerido:** `feat(datos): salas, equipos e incidencias con reporte transaccional`

---

## P05 · API

**Fase:** 4 (cierre) · **Crea:** rutas de `app/api/soporte/`

````text
Antes de escribir código lee completos: doc/PLAN_SOPORTE_SALAS.md (secciones 11.1 a 11.4), doc/ESTADO_EJECUCION.md, lib/dataService.ts, lib/http/respuestas.ts, lib/validacion/esquemas.ts y lib/auth/sesion.ts.

OBJETIVO: exponer las operaciones del módulo mínimo con rutas protegidas.

TAREA 1. Crea las rutas del módulo mínimo de la tabla 11.3 (deja las de técnicos, asignar y alertas para P09). Reglas de cada handler:
- Primera instrucción: await exigirSesion().
- conManejoDeErrores; cuerpos con leerCuerpo y los esquemas de 11.4; filtros validados.
- [codigo] y [numero] con await params.
- export const dynamic = 'force-dynamic'.
- POST de salas, equipos e incidencias responden 201.
- Detalle: POST /api/soporte/equipos/[codigo]/incidencias usa reportarIncidencia; PATCH /api/soporte/equipos/[codigo]/estado usa cambiarEstadoEquipo; POST /api/soporte/incidencias/[numero]/cerrar usa cerrarIncidencia.

TAREA 2. Verificación sin sesión: con npm run dev, GET /api/soporte/equipos y POST /api/soporte/equipos deben dar 401.

TAREA 3. Verificación con sesión: pídeme que inicie sesión. Crea una sala y un equipo por API; reporta una incidencia (comprueba que llega el número de caso y que el equipo pasó a en_reparacion); cambia el estado del equipo; consulta el historial. Prueba reportar con descripción vacía (400). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_4_COMPLETADA.md con probar:flujo (P04) y las verificaciones.
- Marca P05 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** las rutas dan 401 sin sesión; con sesión, reportar una incidencia devuelve el número de caso y el equipo queda en "en reparación".

**Commit sugerido:** `feat(api): rutas de salas, equipos e incidencias protegidas`

---

## P06 · Interfaz base, panel y salas

**Fase:** 5 · **Crea:** `components/ui/*`, layout de `/soporte`, panel y salas · **Modifica:** `app/globals.css`, `app/page.tsx`

````text
Antes de escribir código lee completos: doc/PLAN_SOPORTE_SALAS.md (secciones 5, 6, 12 y 13), doc/ESTADO_ACTUAL.md (secciones 5, 9, 11), doc/ESTADO_EJECUCION.md, lib/dataService.ts y lib/formato.ts.

OBJETIVO: componentes reutilizables, navegación, el panel que muestra salas y equipos, y la gestión de salas.

TAREA 1. Agrega los tokens de color de la sección 13 sin borrar nada existente: con Tailwind 4 en @theme de app/globals.css; con Tailwind 3 en tailwind.config.

TAREA 2. components/ui/: Boton (primario, secundario, peligro, fantasma; prop cargando), Campo, Selector, Tarjeta, Insignia (tono neutro, funcional, reparacion, baja, revision), Aviso (info, exito, advertencia, error), Modal (fondo oscuro, cierre con Escape y botón, foco al abrir, role dialog), EstadoVacio. Foco visible y contraste.

TAREA 3. app/page.tsx: redirección a /soporte (si tiene contenido propio, añade un enlace a /soporte sin borrarlo).

TAREA 4. components/soporte/NavegacionSoporte.tsx y app/soporte/layout.tsx (servidor): obtenerSesion(); sin sesión, redirect al login. Barra con "Soporte de Salas", enlaces Panel (/soporte), Incidencias, Salas (y Técnicos/Alertas cuando existan), correo y cerrar sesión. Menú móvil.

TAREA 5. components/soporte/InsigniaEstadoEquipo.tsx (Funcional/En reparación/Dado de baja con los tonos de la sección 13 y texto) e InsigniaEstadoIncidencia.tsx (Abierta/En revisión/Cerrada).

TAREA 6. Panel: components/soporte/FiltrosEquipos.tsx, TablaEquipos.tsx, SelectorEstadoEquipo.tsx y app/soporte/page.tsx (servidor):
- Resumen por sala: cada sala con su total de equipos y cuántos funcionales, en reparación y dados de baja (a partir de listarSalas y listarEquipos, o un resumen que calcules).
- FiltrosEquipos: por sala, por estado y búsqueda por código, reflejados en la URL.
- TablaEquipos: código (enlace a /soporte/equipos/[codigo]), sala, estado (InsigniaEstadoEquipo) y un SelectorEstadoEquipo que cambia el estado en línea (PATCH /api/soporte/equipos/[codigo]/estado; al cambiar a "dado de baja" pide confirmación con el texto de la sección 12.1; tras cambiar, router.refresh()).
- Botones "Registrar equipo" y "Registrar sala".
- EstadoVacio si no hay equipos.
- Tarjetas apiladas bajo 640 px.

TAREA 7. components/soporte/FormularioSala.tsx y app/soporte/salas/page.tsx (servidor): formulario de nombre y lista de salas con su total de equipos; SALA_DUPLICADA muestra el mensaje.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con los datos DEMO: ver el panel con el resumen por sala; filtrar por estado; cambiar el estado de un equipo desde la tabla (incluida la confirmación al darlo de baja); crear una sala e intentar una repetida (error). Revisa en móvil.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P06 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** ver el panel con los equipos por sala, filtrar por estado y cambiar un estado desde la tabla; crear una sala.

**Commit sugerido:** `feat(interfaz): panel de salas y equipos con cambio de estado`

---

## P07 · Equipos: registro y detalle

**Fase:** 5 · **Crea:** registro de equipo y el detalle del equipo (sin el reporte, que va en P08)

````text
Antes de escribir código lee completos: doc/PLAN_SOPORTE_SALAS.md (secciones 6, 7, 11.3, 12 y 13), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: registrar equipos y ver el detalle de un equipo con su estado y sus datos (el reporte de incidencias y el historial se completan en P08).

TAREA 1. components/soporte/FormularioEquipo.tsx (cliente) y app/soporte/equipos/nuevo/page.tsx: campos código y selector de sala (de listarSalas). Validación con esquemaEquipo; POST /api/soporte/equipos; al guardar, navega a /soporte/equipos/[codigo]. CODIGO_DUPLICADO muestra el mensaje; si no hay salas, un aviso con enlace a crear una.

TAREA 2. app/soporte/equipos/[codigo]/page.tsx (servidor): obtenerEquipo(codigo) (notFound si no existe). Encabezado con el código, la sala y InsigniaEstadoEquipo. SelectorEstadoEquipo para cambiar el estado (los tres, sin secuencia; confirmación al dar de baja). Deja un espacio reservado para "Reportar incidencia" y el historial (P08). Muestra el conteo de incidencias de los últimos 30 días (de v_equipos) como dato informativo.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Registra un equipo en una sala; abre su detalle; cambia su estado desde el detalle; intenta registrar un código repetido (error). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Marca P07 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** registrar un equipo y abrir su detalle; cambiar su estado desde ahí.

**Commit sugerido:** `feat(interfaz): registro y detalle de equipos`

---

## P08 · Incidencias, historial y aceptación del módulo mínimo

**Fase:** 5 y 6 · **Crea:** el reporte, el historial, el listado de incidencias, `doc/ACEPTACION.md` · **Modifica:** `README.md`

````text
Antes de escribir código lee completos: doc/PLAN_SOPORTE_SALAS.md (secciones 6, 7, 8.1, 11.3, 12, 14, 15, 16 y 17), doc/ESTADO_EJECUCION.md y los componentes existentes.

OBJETIVO: reportar incidencias, ver el historial de un equipo y el listado general, y cerrar el módulo mínimo con la aceptación.

TAREA 1. components/soporte/FormularioIncidencia.tsx (cliente): campo descripción; validación en vivo (mínimo 3 caracteres). POST /api/soporte/equipos/[codigo]/incidencias. Al reportar, muestra el número de caso devuelto y que el equipo pasó a "en reparación" (salvo que estuviera dado de baja). En el detalle del equipo, un botón "Reportar incidencia" abre este formulario (modal o sección).

TAREA 2. components/soporte/HistorialIncidencias.tsx y, en app/soporte/equipos/[codigo]/page.tsx, muéstralo bajo los datos del equipo: número de caso, fecha, descripción, estado (InsigniaEstadoIncidencia), técnico si lo tiene; de la más reciente a la más antigua (RN-14). Acción "Cerrar" en incidencias no cerradas (POST /api/soporte/incidencias/[numero]/cerrar; tras cerrar, router.refresh()). EstadoVacio "Este equipo no tiene incidencias".

TAREA 3. components/soporte/* y app/soporte/incidencias/page.tsx (servidor): listado general de incidencias con filtros por estado y por equipo (listarIncidencias): número de caso, equipo (enlace), descripción, estado, fecha, técnico. Útil para ver todo lo abierto.

TAREA 4. Revisa el código contra las secciones 8.1 y 15. Reporta y corrige en la bitácora: reporte que no sea transaccional o que no genere el número de caso por la secuencia; equipo dado de baja que pase a en_reparacion por un reporte; rutas sin exigirSesion; "hoy" con new Date() fuera de fechas.ts; SQL concatenado; textos en inglés; estado comunicado solo con color.

TAREA 5. Ejecuta npm test y npm run probar:flujo; corrige fallas en el código. Prepara la aceptación: db:limpiar --prueba; conserva los demo.

TAREA 6. Crea doc/ACEPTACION.md con la tabla A-01 a A-16 de la sección 16.3 (columnas: ID, acción, resultado esperado, resultado obtenido, evidencia, observación; las tres últimas vacías) y una nota de que A-15 y A-16 corresponden a las opcionales (P09).

TAREA 7. Actualiza README.md: descripción; funcionalidades; requisitos; cómo correr en local (npm install, .env.local con los NOMBRES de las variables, db:migrar, db:demo, dev); scripts y su propósito; estructura de carpetas; una nota de que los datos ahora viven en Postgres (antes en datos.json) y de la separación datos/lógica/web que el plan ya buscaba; nota de seguridad; enlace a doc/PLAN_SOPORTE_SALAS.md.

TAREA 8. Verifica que .env.local esté en .gitignore y que ningún archivo versionado tenga credenciales ni valores de variables de entorno.

AL TERMINAR:
- npm run build y npm test sin errores.
- Crea doc/checkpoints/FASE_5_COMPLETADA.md (interfaz) y doc/checkpoints/FASE_6_COMPLETADA.md (revisión y pruebas).
- Marca P08 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen y recuérdame que A-01 a A-14 se ejecutan en el despliegue de Vercel.
````

**Verificación del estudiante:** reportar una incidencia (ver el número de caso y el cambio a "en reparación"), ver el historial ordenado y cerrar una incidencia. Hacer push y ejecutar A-01 a A-14 en Vercel.

**Commit sugerido:** `feat(interfaz): reporte de incidencias, historial y aceptación`

---

## P09 · Opcionales: técnicos, asignación y alertas

**Fase:** 7 · **Requisito:** `doc/checkpoints/FASE_6_COMPLETADA.md` existe y `doc/ACEPTACION.md` está diligenciado

````text
Antes de escribir código lee completos: doc/PLAN_SOPORTE_SALAS.md (secciones 6, 7 (RN-09 a RN-11), 8 (CU-06, CU-08), 16.1 (T-19 a T-21), 16.3 (A-15, A-16) y 18), doc/ESTADO_EJECUCION.md y doc/checkpoints/FASE_6_COMPLETADA.md. Si FASE_6_COMPLETADA.md no existe, detente y avísame.

OBJETIVO: F5 (técnicos, asignación y reasignación automática) y F6 (alertas de candidatos a baja).

TAREA 1. F5 · Técnicos y asignación:
- lib/datos/tecnicos.ts: listarTecnicos(); crearTecnico(nombre) (TECNICO_DUPLICADO si choca); asignarTecnico(numeroCaso, tecnicoId): la incidencia debe estar 'abierta' (puedeAsignarse, RN-11; si no, INCIDENCIA_NO_ASIGNABLE); pasa a 'en_revision' con el técnico y actualiza fecha_estado. Reexporta en dataService.
- Rutas: GET y POST /api/soporte/tecnicos; POST /api/soporte/incidencias/[numero]/asignar.
- Pantalla /soporte/tecnicos (crear y listar); en el detalle de una incidencia abierta, un selector de técnico para asignar.

TAREA 2. F5 · Reasignación automática (RN-10):
- reasignarIncidenciasVencidas(): las incidencias en 'en_revision' con diasEntre(fecha_estado, hoyBogota()) > DIAS_REASIGNACION (5) se reasignan a otro técnico activo (por ejemplo, el técnico activo con menos incidencias en revisión, distinto del actual); actualiza tecnico_id y fecha_estado. Devuelve { reasignadas }.
- Exponlo como una ruta protegida (por ejemplo GET /api/soporte/mantenimiento/reasignar) o un Vercel Cron con un secreto (CRON_SECRET, nunca en el código). Documenta cuál elegiste.

TAREA 3. F6 · Alertas de candidatos a baja (RN-09):
- Verifica que lib/reglas/alertas.ts y las pruebas T-19 a T-21 pasan.
- listarCandidatosABaja(): por cada equipo activo (no dado de baja), cuenta las incidencias con fecha dentro de la ventana de 30 días (con hoyBogota() y dentroDeVentana); devuelve los que llegan a INCIDENCIAS_PARA_ALERTA, con código, sala y conteo.
- Ruta GET /api/soporte/alertas; pantalla /soporte/alertas con PanelAlertas (equipos candidatos, su sala y el conteo). Además, un aviso en el panel principal si hay candidatos, con enlace a /soporte/alertas.

VERIFICACIÓN: pídeme que inicie sesión si lo necesitas. Con los datos DEMO (un equipo con 3 incidencias recientes): crear un técnico; asignarlo a una incidencia abierta (pasa a en revisión); intentar asignar una ya en revisión (error); ver /soporte/alertas con el equipo candidato a baja; probar reasignarIncidenciasVencidas (puedes bajar temporalmente DIAS_REASIGNACION para forzarlo y luego restaurarlo). Documenta.

AL TERMINAR:
- npm run build y npm test sin errores.
- Agrega a doc/ACEPTACION.md los resultados de A-15 y A-16.
- Crea doc/checkpoints/FASE_7_COMPLETADA.md.
- Marca P09 en ESTADO_EJECUCION.md y agrega su sección en la bitácora.
- Muéstrame un resumen.
````

**Verificación del estudiante:** crear un técnico y asignarlo a una incidencia abierta; ver el panel de alertas con un equipo candidato a baja (3 incidencias en 30 días).

**Commit sugerido:** `feat(opcional): técnicos, asignación y alertas de baja`

---

## Prompts auxiliares

### Corrección de un error

Reemplazar `[NN]` por el número del prompt y pegar el error completo donde se indica.

````text
Durante la ejecución del prompt P[NN] apareció este error:

[PEGAR AQUÍ EL ERROR COMPLETO]

Lee doc/PLAN_SOPORTE_SALAS.md, doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Encuentra la causa y corrígela sin salir del alcance de P[NN]. No modifiques pruebas ni scripts de prueba para que pasen; corrige el código que prueban. Ejecuta npm run build y npm test. Registra en la bitácora la causa, la corrección y los archivos modificados. Muéstrame un resumen.
````

### Reanudación de un prompt interrumpido

````text
La ejecución anterior del prompt P[NN] se interrumpió. Lee doc/ESTADO_EJECUCION.md, doc/PLAN_SOPORTE_SALAS.md y doc/PROMPTS_SOPORTE_SALAS.md (sección P[NN]). Revisa qué archivos de P[NN] ya existen y cuáles faltan, y continúa desde la primera tarea incompleta sin rehacer lo terminado. Al final ejecuta npm run build y npm test, y actualiza la bitácora.
````

### Despliegue fallido en Vercel

````text
El despliegue en Vercel falló con este registro:

[PEGAR AQUÍ EL REGISTRO DEL BUILD DE VERCEL]

Lee doc/ESTADO_ACTUAL.md y doc/ESTADO_EJECUCION.md. Identifica la causa (error de compilación, variable de entorno faltante en Vercel, o diferencia entre local y producción). Si es de código, corrígelo y verifica con npm run build. Si es una variable de entorno, dime exactamente qué NOMBRE de variable falta y en qué entornos de Vercel agregarla, sin pedir ni mostrar valores. Registra la causa y la solución en la bitácora.
````

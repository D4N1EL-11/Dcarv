import type { Metadata } from 'next';
import { AccionesRepuesto } from '@/components/soporte/AccionesRepuesto';
import { FormularioRepuesto } from '@/components/soporte/FormularioRepuesto';
import { Cifra } from '@/components/ui/Cifra';
import { EncabezadoPagina, TituloSeccion } from '@/components/ui/Encabezado';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Insignia } from '@/components/ui/Insignia';
import { Tarjeta } from '@/components/ui/Tarjeta';
import { soloSoporte } from '@/lib/auth/sesion';
import { DIAS_VENTANA_ALERTA } from '@/lib/config/soporte';
import { listarRepuestos } from '@/lib/dataService';
import { plural } from '@/lib/formato';
import { bajoMinimo } from '@/lib/reglas/repuesto';

export const metadata: Metadata = { title: 'Repuestos' };

const formatoPesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

// Bodega de repuestos: existencias, mínimo y consumo reciente. Lo que hay que comprar va primero.
export default async function PaginaRepuestos() {
  await soloSoporte();
  const repuestos = await listarRepuestos();
  const porComprar = repuestos.filter(bajoMinimo);
  const usados = repuestos.reduce((suma, r) => suma + r.usados30d, 0);
  const ordenados = [...porComprar, ...repuestos.filter((r) => !bajoMinimo(r))];

  return (
    <>
      <EncabezadoPagina
        etiqueta="Bodega"
        titulo="Repuestos"
        descripcion="Piezas disponibles para las reparaciones. Al anotar un repuesto en un caso se descuenta de la bodega; una entrada (compra o devolución) lo suma. Por debajo del mínimo se marca para compra."
      />

      <section aria-label="Resumen" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Cifra titulo="Repuestos" valor={repuestos.length} detalle="tipos de pieza registrados" icono="repuesto" />
        <Cifra
          titulo="Por comprar"
          valor={porComprar.length}
          detalle="agotados o bajo el mínimo"
          icono="alertas"
          color={porComprar.length ? 'text-baja' : 'text-funcional'}
        />
        <Cifra
          titulo="Usados"
          valor={usados}
          detalle={`unidades en los últimos ${DIAS_VENTANA_ALERTA} días`}
          icono="grafico"
          color="text-revision"
        />
      </section>

      <div className="grid items-start gap-10 xl:grid-cols-[22rem_minmax(0,1fr)] xl:gap-8 2xl:grid-cols-[26rem_minmax(0,1fr)]">
        <Tarjeta className="grid gap-3 xl:sticky xl:top-24">
          <h2 className="text-xl font-medium">Registrar un repuesto</h2>
          <FormularioRepuesto />
        </Tarjeta>

        <section aria-labelledby="titulo-bodega" className="grid gap-5">
          <TituloSeccion id="titulo-bodega" titulo="En bodega">
            <span className="text-sm text-texto-suave">{plural(repuestos.length, 'repuesto', 'repuestos')}</span>
          </TituloSeccion>
          {ordenados.length ? (
            <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {ordenados.map((r) => {
                const comprar = bajoMinimo(r);
                return (
                  <li key={r.id}>
                    <Tarjeta className={`grid h-full gap-3 ${comprar ? 'border-l-4 border-l-baja' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold leading-tight text-texto">{r.nombre}</h3>
                        {comprar ? <Insignia tono="baja" texto={r.existencias ? 'Bajo mínimo' : 'Agotado'} /> : null}
                      </div>
                      <dl className="grid grid-cols-3 gap-2">
                        {[
                          ['En bodega', r.existencias],
                          ['Mínimo', r.minimo],
                          [`Usados ${DIAS_VENTANA_ALERTA} d`, r.usados30d],
                        ].map(([titulo, valor]) => (
                          <div key={titulo} className="rounded-lg bg-superficie-alta px-3 py-2">
                            <dt className="text-[0.65rem] uppercase tracking-[0.15em] text-texto-suave">{titulo}</dt>
                            <dd className="text-xl font-semibold tabular-nums">{valor}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-texto-suave">
                          {r.costoUnitario ? `${formatoPesos.format(r.costoUnitario)} por unidad` : 'Sin costo registrado'}
                        </span>
                        <AccionesRepuesto id={r.id} nombre={r.nombre} minimo={r.minimo} costo={r.costoUnitario} />
                      </div>
                    </Tarjeta>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EstadoVacio titulo="Aún no hay repuestos" icono="repuesto">
              Registre el primero con el formulario.
            </EstadoVacio>
          )}
        </section>
      </div>
    </>
  );
}

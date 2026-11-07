import type { Metadata } from 'next';
import QRCode from 'qrcode';
import { Boton } from '@/components/ui/Boton';
import { BotonImprimir } from '@/components/ui/BotonImprimir';
import { EncabezadoPagina } from '@/components/ui/Encabezado';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import { Selector } from '@/components/ui/Selector';
import { soloSoporte } from '@/lib/auth/sesion';
import { listarEquipos, listarSalas } from '@/lib/dataService';
import { plural } from '@/lib/formato';
import { normalizarCodigo } from '@/lib/reglas/equipo';
import { obtenerUrlBase } from '@/lib/urlBase';

export const metadata: Metadata = { title: 'Etiquetas QR' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Cada etiqueta lleva al formulario de reporte con el equipo ya elegido. Quien no ha iniciado
// sesión pasa por el login (o crea su cuenta) y vuelve a ese mismo formulario.
async function codigoQr(url: string): Promise<string> {
  return QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 1, width: 280, color: { dark: '#111111', light: '#ffffff' } });
}

export default async function PaginaEtiquetas({ searchParams }: Props) {
  await soloSoporte();
  const parametros = await searchParams;
  const salaId = typeof parametros.salaId === 'string' ? parametros.salaId : '';
  const unico = typeof parametros.equipo === 'string' ? normalizarCodigo(parametros.equipo) : '';
  const [salas, equipos] = await Promise.all([listarSalas(), listarEquipos()]);

  // Un equipo (desde su ficha) o los equipos en servicio de una sala.
  const elegidos = unico
    ? equipos.filter((e) => e.codigo === unico)
    : salaId
      ? equipos.filter((e) => e.salaId === salaId && e.estado !== 'dado_de_baja')
      : [];
  const base = obtenerUrlBase();
  const etiquetas = await Promise.all(
    elegidos.map(async (equipo) => {
      const url = `${base}/soporte/reportar?equipo=${encodeURIComponent(equipo.codigo)}`;
      return { ...equipo, url, imagen: await codigoQr(url) };
    }),
  );
  const sala = salas.find((s) => s.id === salaId);

  return (
    <>
      <div className="grid gap-6 print:hidden">
        <EncabezadoPagina
          etiqueta="Reporte con el celular"
          titulo="Etiquetas QR"
          descripcion="Imprima y pegue una etiqueta en cada equipo. Al escanearla con el celular se abre el formulario de reporte con ese equipo ya elegido, también para las cuentas de reporte."
        >
          {etiquetas.length ? <BotonImprimir texto={`Imprimir ${plural(etiquetas.length, 'etiqueta', 'etiquetas')}`} /> : null}
        </EncabezadoPagina>
        <form method="get" action="/soporte/etiquetas" className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Selector
            etiqueta="Sala"
            name="salaId"
            defaultValue={unico ? '' : salaId}
            opciones={[{ valor: '', texto: 'Elija una sala' }, ...salas.map((s) => ({ valor: s.id, texto: `${s.nombre} (${plural(s.totalEquipos, 'equipo', 'equipos')})` }))]}
          />
          <Boton type="submit" variante="secundario">
            Ver etiquetas
          </Boton>
        </form>
        {etiquetas.length ? (
          <p className="text-xs text-texto-suave">
            Los códigos apuntan a <span className="font-medium text-texto">{base}</span>. Los equipos dados de baja no llevan etiqueta.
          </p>
        ) : null}
      </div>

      {etiquetas.length ? (
        <ul aria-label={sala ? `Etiquetas de ${sala.nombre}` : 'Etiqueta del equipo'} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 print:grid-cols-3 print:gap-3">
          {etiquetas.map((etiqueta) => (
            <li key={etiqueta.codigo} className="grid justify-items-center gap-2 rounded-xl border border-dashed border-[#999] bg-white p-4 text-center text-[#111] break-inside-avoid">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-[#6b4e12]">Soporte de Salas</span>
              <img src={etiqueta.imagen} alt={`Código QR para reportar una falla de ${etiqueta.codigo}`} className="size-36" />
              <span className="font-sans text-xl font-bold tracking-wide">{etiqueta.codigo}</span>
              <span className="text-xs text-[#444]">{etiqueta.sala}</span>
              <span className="text-[0.7rem] leading-tight text-[#444]">¿Falla este equipo? Escanee y repórtelo.</span>
            </li>
          ))}
        </ul>
      ) : (
        <EstadoVacio titulo={unico ? `No existe el equipo ${unico}` : salaId ? 'Esta sala no tiene equipos en servicio' : 'Elija una sala'} icono="qr">
          {unico || salaId ? 'Revise el código o elija otra sala.' : 'Se generará una etiqueta por cada equipo en servicio de la sala.'}
        </EstadoVacio>
      )}
    </>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Aviso } from '@/components/ui/Aviso';
import { useAvisos } from '@/components/ui/Avisos';
import { Boton } from '@/components/ui/Boton';
import { Campo, CampoTexto } from '@/components/ui/Campo';
import { Selector } from '@/components/ui/Selector';
import { useRefrescar } from '@/hooks/use-refrescar';
import { llamarApi } from '@/lib/clienteApi';
import { CATEGORIAS_INCIDENCIA, LARGO_MAXIMO_ARTICULO } from '@/lib/config/soporte';
import { ETIQUETA_CATEGORIA, type CategoriaIncidencia } from '@/lib/reglas/clasificacion';
import { esquemaArticulo } from '@/lib/validacion/esquemas';

type Inicial = { id: string; titulo: string; categoria: CategoriaIncidencia; contenido: string; palabrasClave: string };

// Escribir una guía nueva o editar una existente (con `articulo`).
export function FormularioArticulo({ articulo, alTerminar }: { articulo?: Inicial; alTerminar?: () => void }) {
  const router = useRouter();
  const { refrescar, refrescando } = useRefrescar();
  const { mostrar } = useAvisos();
  const [titulo, setTitulo] = useState(articulo?.titulo ?? '');
  const [categoria, setCategoria] = useState<CategoriaIncidencia>(articulo?.categoria ?? 'hardware');
  const [contenido, setContenido] = useState(articulo?.contenido ?? '');
  const [palabrasClave, setPalabrasClave] = useState(articulo?.palabrasClave ?? '');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const validacion = esquemaArticulo.safeParse({ titulo, categoria, contenido, palabrasClave });
    if (!validacion.success) {
      setError(validacion.error.issues[0]?.message ?? 'Revise los datos ingresados.');
      return;
    }
    setCargando(true);
    const respuesta = articulo
      ? await llamarApi(`/api/soporte/conocimiento/${articulo.id}`, 'PATCH', validacion.data)
      : await llamarApi<{ id: string }>('/api/soporte/conocimiento', 'POST', validacion.data);
    setCargando(false);
    if (!respuesta.ok) {
      setError(respuesta.mensaje);
      return;
    }
    mostrar('exito', articulo ? 'La guía quedó actualizada.' : 'La guía quedó publicada.');
    if (articulo) {
      alTerminar?.();
      refrescar();
    } else {
      router.push(`/soporte/conocimiento/${(respuesta.datos as { id: string }).id}`);
    }
  }

  return (
    <form onSubmit={enviar} className="grid gap-3" noValidate>
      <Campo
        etiqueta="Título"
        value={titulo}
        maxLength={120}
        placeholder="Ej.: El proyector no muestra imagen"
        onChange={(evento) => {
          setTitulo(evento.target.value);
          setError('');
        }}
      />
      <Selector
        etiqueta="Tipo de falla"
        value={categoria}
        onChange={(evento) => setCategoria(evento.target.value as CategoriaIncidencia)}
        opciones={CATEGORIAS_INCIDENCIA.map((c) => ({ valor: c, texto: ETIQUETA_CATEGORIA[c] }))}
      />
      <CampoTexto
        etiqueta="Pasos para resolverlo"
        value={contenido}
        maxLength={LARGO_MAXIMO_ARTICULO}
        rows={8}
        placeholder={'1. Verifique que el cable HDMI esté conectado.\n2. Pulse Windows + P y elija "Duplicar".\n3. …'}
        onChange={(evento) => {
          setContenido(evento.target.value);
          setError('');
        }}
      />
      <Campo
        etiqueta="Palabras clave (opcional)"
        value={palabrasClave}
        maxLength={200}
        placeholder="proyector, hdmi, pantalla, video beam"
        onChange={(evento) => setPalabrasClave(evento.target.value)}
      />
      <p className="text-xs text-texto-suave">Las palabras clave ayudan a sugerir la guía cuando alguien reporta una falla parecida.</p>
      {error ? <Aviso tipo="error">{error}</Aviso> : null}
      <Boton type="submit" cargando={cargando || refrescando}>
        {articulo ? 'Guardar cambios' : 'Publicar guía'}
      </Boton>
    </form>
  );
}

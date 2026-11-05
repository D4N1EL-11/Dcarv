const TIPOS = {
  info: 'border-primario/40 bg-primario-suave text-texto',
  exito: 'border-funcional/40 bg-funcional/10 text-funcional',
  advertencia: 'border-reparacion/40 bg-reparacion/10 text-reparacion',
  error: 'border-baja/40 bg-baja/10 text-baja',
};

export function Aviso({
  tipo = 'info',
  children,
}: {
  tipo?: keyof typeof TIPOS;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-sm ${TIPOS[tipo]}`}
    >
      {children}
    </div>
  );
}

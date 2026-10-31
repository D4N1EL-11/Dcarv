const TIPOS = {
  info: 'border-primario bg-primario-suave text-texto',
  exito: 'border-funcional bg-superficie text-funcional',
  advertencia: 'border-reparacion bg-superficie text-[#8a5a12]',
  error: 'border-baja bg-superficie text-baja',
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
      className={`rounded-lg border px-3 py-2 text-sm ${TIPOS[tipo]}`}
    >
      {children}
    </div>
  );
}

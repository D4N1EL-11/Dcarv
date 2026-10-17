function conProtocoloSeguro(dominio: string): string {
	return `https://${dominio.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
}

export function obtenerUrlBase(): string {
	const urlAplicacion = process.env.APP_URL?.trim();
	if (urlAplicacion) return urlAplicacion.replace(/\/+$/, '');

	if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
		return conProtocoloSeguro(process.env.VERCEL_PROJECT_PRODUCTION_URL);
	}

	if (process.env.VERCEL_URL) return conProtocoloSeguro(process.env.VERCEL_URL);
	return 'http://localhost:3000';
}
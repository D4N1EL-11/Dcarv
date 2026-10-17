function escaparHtml(valor: string): string {
	return valor.replace(/[&<>"']/g, (caracter) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
	})[caracter] ?? caracter);
}

export function plantillaRecuperacion(enlace: string): string {
	const enlaceSeguro = escaparHtml(enlace);
	return `<!doctype html>
<html lang="es">
	<body style="margin:0;background:#f3efe7;color:#172033;font-family:Arial,sans-serif;padding:32px 16px">
		<div style="background:#fffdf8;border:1px solid #dedbd3;border-radius:8px;margin:0 auto;max-width:520px;padding:32px">
			<h1 style="font-size:22px;margin:0 0 16px">Restablecer contraseña</h1>
			<p style="font-size:15px;line-height:1.6">Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p>
			<p style="margin:24px 0"><a href="${enlaceSeguro}" style="background:#e15f3d;border-radius:6px;color:#fff;display:inline-block;font-weight:700;padding:13px 20px;text-decoration:none">Crear contraseña nueva</a></p>
			<p style="font-size:14px;line-height:1.6">Este enlace vence en 30 minutos y solo se puede usar una vez.</p>
			<p style="color:#657086;font-size:13px;line-height:1.6">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
		</div>
	</body>
</html>`;
}
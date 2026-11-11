/**
 * Interruptor del modo publico del panel.
 *
 * Por defecto CERRADO: mientras `PANEL_PUBLICO` no sea exactamente "true", el
 * panel no publica nada de actividad — ni estado, ni Jira, ni commits, ni
 * musica, ni video, ni formulario de contacto.
 *
 * Motivo: auditoria de huella del 2026-11-11 (tarea B4). El panel publicaba en
 * vivo la rutina, los titulos de tickets internos del trabajo y el repo
 * laboral. Abrir esto vuelve a exponer esos datos: es una decision explicita,
 * no un descuido de despliegue.
 *
 * Contexto: ~/Vaults/SegundoCerebro/3-Recursos/Marca-Personal/Auditoria-Huella.md
 */
/**
 * Se lee en cada llamada, no al importar el modulo: asi los tests pueden fijar
 * el entorno despues del import (mismo criterio que `configRedis` en estado.ts).
 */
export function esPanelPublico(): boolean {
  return process.env.PANEL_PUBLICO === 'true';
}

/**
 * Respuesta de las rutas de solo lectura con el panel cerrado.
 *
 * 404 y no 403 a proposito: no confirma que el endpoint exista, solo que no
 * hay nada ahi. El texto es generico para no filtrar que habia antes.
 */
export function noDisponible(): Response {
  return new Response('No encontrado', {
    status: 404,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

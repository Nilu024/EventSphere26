/**
 * Thin holder for the Socket.IO server so services can emit without importing the
 * socket layer (avoids circular imports). All functions are no-ops until setIO() is
 * called, which keeps HTTP-only tests and scripts working.
 */
let io = null;

export const setIO = (instance) => { io = instance; };
export const getIO = () => io;

export const userRoom = (id) => `user:${id}`;
export const eventRoom = (id) => `event:${id}`;
export const networkingRoom = (id) => `networking:${id}`;

export function emitToUser(userId, event, payload) {
  io?.to(userRoom(userId)).emit(event, payload);
}
export function emitToRoom(room, event, payload) {
  io?.to(room).emit(event, payload);
}
export function joinUserToRoom(userId, room) {
  io?.in(userRoom(userId)).socketsJoin(room);
}
export function destroyRoom(room) {
  io?.in(room).socketsLeave(room);
}
/** True when the user has at least one live socket. When Socket.IO is not running (HTTP-only/tests) assume true. */
export async function isUserOnline(userId) {
  if (!io) return true;
  const sockets = await io.in(userRoom(userId)).fetchSockets();
  return sockets.length > 0;
}

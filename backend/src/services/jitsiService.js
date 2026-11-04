import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const isJaaS = () => Boolean(env.JITSI_PRIVATE_KEY && env.JITSI_APP_ID);
export const isJwtEnabled = () => isJaaS() || Boolean(env.JITSI_APP_ID && env.JITSI_APP_SECRET);

/** 128 bits of CSPRNG entropy -> unguessable room names. */
export const generateRoomId = () => `eventsphere-${crypto.randomBytes(16).toString('hex')}`;

/**
 * Builds the room descriptor sent to a participant. When JWT signing is configured, a short-lived per-user
 * token bound to this room is included so an authenticated Jitsi deployment only admits the paired users.
 * Without JWT config the room name is the only secret - see docs/JITSI.md for hardening.
 */
export function buildRoomInfo({ roomId, user, expiresAt }) {
  const base = { domain: env.JITSI_DOMAIN, roomName: roomId, jwt: null, authenticated: false };
  let roomPath = roomId;

  if (isJwtEnabled()) {
    const exp = Math.floor(new Date(expiresAt).getTime() / 1000) + 60;
    const context = { user: { id: String(user.id || user._id), name: user.name, moderator: false } };
    if (isJaaS()) {
      // 8x8 JaaS: RS256, kid = "<appId>/<keyId>", room path prefixed with the app id.
      roomPath = `${env.JITSI_APP_ID}/${roomId}`;
      base.jwt = jwt.sign(
        { aud: 'jitsi', iss: 'chat', sub: env.JITSI_APP_ID, room: roomId, nbf: Math.floor(Date.now() / 1000) - 10, exp, context },
        env.JITSI_PRIVATE_KEY,
        { algorithm: 'RS256', header: { kid: `${env.JITSI_APP_ID}/${env.JITSI_KEY_ID}`, typ: 'JWT' } }
      );
    } else {
      // Self-hosted prosody token auth: HS256 with shared app secret.
      base.jwt = jwt.sign(
        { aud: 'jitsi', iss: env.JITSI_APP_ID, sub: env.JITSI_DOMAIN, room: roomId, nbf: Math.floor(Date.now() / 1000) - 10, exp, context },
        env.JITSI_APP_SECRET,
        { algorithm: 'HS256' }
      );
    }
    base.authenticated = true;
  }
  base.url = `https://${env.JITSI_DOMAIN}/${roomPath}${base.jwt ? `?jwt=${base.jwt}` : ''}`;
  return base;
}

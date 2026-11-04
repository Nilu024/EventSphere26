export const ROLES = Object.freeze({
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  PARTICIPANT: 'participant',
});
export const ALL_ROLES = Object.values(ROLES);
/** Roles a user may self-select at registration (admin accounts are never self-service). */
export const SELF_REGISTER_ROLES = [ROLES.PARTICIPANT, ROLES.ORGANIZER];

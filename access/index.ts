import type { Access, FieldAccess } from "payload";

export const anyone: Access = () => true;

export const authenticated: Access = ({ req: { user } }) => Boolean(user);

export const authenticatedField: FieldAccess = ({ req: { user } }) => Boolean(user);

/** Public can create; only admins can read/update/delete. */
export const publicCreateAdminManage = {
  create: anyone,
  read: authenticated,
  update: authenticated,
  delete: authenticated,
};

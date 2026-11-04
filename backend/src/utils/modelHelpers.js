/** Shared toJSON: expose `id`, hide `_id`/`__v` and any sensitive fields. */
export function applyJSON(schema, hidden = []) {
  schema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      for (const k of hidden) delete ret[k];
      return ret;
    },
  });
}

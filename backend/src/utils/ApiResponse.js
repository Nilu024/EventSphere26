export class ApiResponse {
  static send(res, statusCode, message, data = null, meta = undefined) {
    const body = { success: true, message, data };
    if (meta !== undefined) body.meta = meta;
    return res.status(statusCode).json(body);
  }
  static ok(res, message, data = null, meta) { return ApiResponse.send(res, 200, message, data, meta); }
  static created(res, message, data = null) { return ApiResponse.send(res, 201, message, data); }
}

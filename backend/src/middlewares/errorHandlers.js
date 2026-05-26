export function notFoundHandler(req, res, next) {
  res.status(404).json({ message: 'Không tìm thấy' })
}

export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err)
  const status = err.statusCode || err.status || 500
  res.status(status).json({
    message: err.message || 'Lỗi hệ thống',
    details: err.details || undefined
  })
}


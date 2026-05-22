export function notFoundHandler(req, res, next) {
  res.status(404).json({ message: 'Not found' })
}

export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err)
  const status = err.statusCode || err.status || 500
  res.status(status).json({
    message: err.message || 'Internal error',
    details: err.details || undefined
  })
}


//  errors into json responses and logs them

module.exports = function errorHandler() {
  
  return (err, req, res, next) => {
    const status = err.status || 500;

    if (status >= 500) {
    
      console.error(`[error] ${req.method} ${req.originalUrl}`, err);
    } else {
     
      console.warn(`[warn] ${req.method} ${req.originalUrl} -> ${status} ${err.message}`);
    }

    
    res.status(status).json({
      error: status >= 500 ? 'internal server error' : err.message,
    });
  };
};

const express = require('express');
const { buildContainer } = require('./container');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const userRoutes = require('./routes/userRoutes');
const brandRoutes = require('./routes/brandRoutes');
const saleRoutes = require('./routes/saleRoutes');
const jobRoutes = require('./routes/jobRoutes');
const payoutRoutes = require('./routes/payoutRoutes');


const path = require('path');

function createApp(db) {
  const c = buildContainer(db);
  const app = express();
  app.use(express.json());
  app.use(requestLogger());

  //  health check
  app.get('/health', (req, res) => res.json({ ok: true }));

  // openapi spec and interactive swagger docs
  app.get('/openapi.json', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'openapi.json'));
  });

  app.get('/docs', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Documentation - Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>html { box-sizing: border-box; overflow-y: scroll; } *, *:before, *:after { box-sizing: inherit; } body { margin: 0; background: #fafafa; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true
      });
    };
  </script>
</body>
</html>`);
  });

  app.use(userRoutes(c));
  app.use(brandRoutes(c));
  app.use(saleRoutes(c));
  app.use(jobRoutes(c));
  app.use(payoutRoutes(c));

  
  app.use(errorHandler());

  return app;
}

module.exports = { createApp };

const { openDb } = require('./db/db');
const { seed } = require('./db/seed');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;

const db = openDb(process.env.DATABASE_FILE || 'payouts.db');


seed(db);

const app = createApp(db);
const server = app.listen(PORT, () => {
  console.log(`payout service running on http://localhost:${PORT}`);
});

// graceful shutdown
// stop taking new requests finish the ones in flight close the db then exit
function shutdown(signal) {
  console.log(`\n${signal} received shutting down`);
  server.close(() => {
    db.close(); 
    console.log('closed cleanly');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('could not close in time forcing exit');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM')); 
process.on('SIGINT', () => shutdown('SIGINT')); 

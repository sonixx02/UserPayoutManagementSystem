const crypto = require('crypto');




const BRANDS = [
  { name: 'brand_1', advanceRateBps: 1000 }, // 10 percent
  { name: 'brand_2', advanceRateBps: 500 }, // 5 percent
  { name: 'brand_3', advanceRateBps: 200 }, // 2 percent
];

const SAMPLE_USER = 'demo_user';
const SAMPLE_SALES = [
  { brand: 'brand_1', earningPaise: 4000 },
  { brand: 'brand_1', earningPaise: 4000 },
  { brand: 'brand_2', earningPaise: 6000 },
];

function seed(db) {
  const insertBrand = db.prepare(
    'INSERT OR IGNORE INTO brands (name, advance_rate_bps) VALUES (@name, @advanceRateBps)'
  );
  for (const b of BRANDS) insertBrand.run(b);

  
  const already = db.prepare('SELECT 1 FROM users WHERE id = @id').get({ id: SAMPLE_USER });
  if (already) return;

  db.prepare('INSERT INTO users (id) VALUES (@id)').run({ id: SAMPLE_USER });
  const insertSale = db.prepare(
    `INSERT INTO sales (id, user_id, brand, earning_paise)
     VALUES (@id, @userId, @brand, @earningPaise)`
  );
  for (const s of SAMPLE_SALES) {
    insertSale.run({
      id: crypto.randomUUID(),
      userId: SAMPLE_USER,
      brand: s.brand,
      earningPaise: s.earningPaise,
    });
  }
}

module.exports = { seed };

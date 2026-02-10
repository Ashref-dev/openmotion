import { db } from '../index';
import { templates } from '../schema';
import { templateSeeds } from './templates';

async function seed() {
  console.log('🌱 Seeding database...');

  console.log('📦 Inserting templates...');
  await db.insert(templates).values(templateSeeds).onConflictDoNothing();

  console.log('✅ Database seeded successfully!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});

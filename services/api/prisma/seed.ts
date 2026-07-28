import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

config({
  path: path.resolve(currentDirectory, '../../../.env'),
});

import { hash } from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main(): Promise<void> {
  const founderPasswordHash = await hash('NeighbourLocal123!', {
    type: 2,
  });

  const user = await prisma.user.upsert({
    where: { email: 'founder@neighbour.local' },
    update: {
      passwordHash: founderPasswordHash,
    },
    create: {
      email: 'founder@neighbour.local',
      displayName: 'Neighbour Founder',
      passwordHash: founderPasswordHash,
    },
  });

  const community = await prisma.community.upsert({
    where: { slug: 'neighbour-foundation' },
    update: {},
    create: {
      name: 'Neighbour Foundation',
      slug: 'neighbour-foundation',
      description: 'Initial seeded community for local development.',
      visibility: 'PRIVATE',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_communityId: {
        userId: user.id,
        communityId: community.id,
      },
    },
    update: {
      role: 'OWNER',
      status: 'ACTIVE',
    },
    create: {
      userId: user.id,
      communityId: community.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  console.log('Neighbour database seed completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

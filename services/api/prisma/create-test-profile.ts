import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = "d3d98823-bdb7-4b12-b43f-13791e16559b";

  const existing = await prisma.userProfile.findUnique({
    where: {
      userId,
    },
  });

  if (existing) {
    console.log("Profile already exists:", existing);
    return;
  }

  const profile = await prisma.userProfile.create({
    data: {
      userId,
      username: "jason",
      bio: null,
      avatarUrl: null,
      localArea: null,
      showLocalArea: true,
    },
  });

  console.log("Created profile:", profile);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

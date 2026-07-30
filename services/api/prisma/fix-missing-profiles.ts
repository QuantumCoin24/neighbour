import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

async function main() {

  const users = await prisma.user.findMany({
    include: {
      profile: true,
    },
  });

  for (const user of users) {

    if (!user.profile) {

      let username =
        user.email.split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g,'');

      let exists = await prisma.userProfile.findUnique({
        where:{ username }
      });

      if (exists) {
        username = `${username}${Date.now()}`;
      }

      await prisma.userProfile.create({
        data:{
          id: randomUUID(),
          userId:user.id,
          username,
          bio:null,
          avatarUrl:null,
          localArea:null,
          showLocalArea:true,
        },
      });

      console.log(
        "Created profile for:",
        user.email
      );
    }
  }

  console.log("✅ Profile repair complete");
}

main()
.catch(console.error)
.finally(()=>prisma.$disconnect());

import { prisma } from "../src/lib/prisma"

async function main() {
  console.log("🌱 initializing seed...")

  // Clean old registers to prevent duplicates on tests
  await prisma.cardLock.deleteMany()
  await prisma.card.deleteMany()
  await prisma.column.deleteMany()
  await prisma.board.deleteMany()
  await prisma.user.deleteMany()

  const user1 = await prisma.user.create({
    data: {
      name: 'Alice Silva',
      email: 'alice@example.com',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    },
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'Bob Santos',
      email: 'bob@example.com',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    },
  });

  const board = await prisma.board.create({
    data: {
      title: 'Latchly Project - Kanban',
      columns: {
        create: [
          {
            title: 'To Do',
            position: 0,
            cards: {
              create: [
                {
                  title: 'Model WebSocket architecture',
                  description: 'Define claim-lock, lock-acquired, and release-lock events.',
                  position: 0,
                },
                {
                  title: 'Configure lock expiration with TTL',
                  description: 'Ensure idle locks expire after 30 seconds.',
                  position: 1,
                },
              ],
            },
          },
          {
            title: 'In Progress',
            position: 1,
            cards: {
              create: [
                {
                  title: 'Configure Prisma ORM and Neon DB',
                  description: 'Set up schema, migrations, and singleton connection.',
                  position: 0,
                },
              ],
            },
          },
          {
            title: 'Done',
            position: 2,
          },
        ],
      },
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`Users created: ${user1.name} (${user1.id}), ${user2.name} (${user2.id})`);
  console.log(`Board created: ${board.title} (${board.id})`);
}

main().catch((e) => {
  console.error('❌ Error during seed:', e);
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
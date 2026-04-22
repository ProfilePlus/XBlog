import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const images = [
    '/images/beyond-the-machine.png',
    '/images/borderlands.jpg',
    '/images/easy-hard.jpg',
    '/images/only-openings.jpg',
    '/images/the-webs-grain.jpg',
    '/images/what-screens-want.jpg',
    '/images/shape-cover.jpg'
  ];

  const articles = await prisma.article.findMany();
  console.log(`Found ${articles.length} articles. Updating coverUrls...`);

  for (let i = 0; i < articles.length; i++) {
    const coverUrl = images[i % images.length];
    await prisma.article.update({
      where: { id: articles[i].id },
      data: { coverUrl }
    });
    console.log(`Updated article "${articles[i].title}" with cover ${coverUrl}`);
  }

  // Also fix category covers
  const categories = await prisma.category.findMany();
  for (let i = 0; i < categories.length; i++) {
     // Categoriy covers were pointing to missing library subfolders, fix to direct path
     if (categories[i].coverUrl?.includes('category-covers/library')) {
        const coverUrl = categories[i].coverUrl || '';
        const fileName = coverUrl.split('/').pop();
        if (fileName) {
          await prisma.category.update({
            where: { id: categories[i].id },
            data: { coverUrl: `/images/${fileName}` }
          });
          console.log(`Updated category "${categories[i].name}" with cover /images/${fileName}`);
        }
     }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

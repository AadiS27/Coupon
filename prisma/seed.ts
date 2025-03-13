const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const coupons = Array.from({ length: 20 }, (_, i) => ({
        code: `TOKEN-${i + 1}`, // Generates TOKEN-1, TOKEN-2, ..., TOKEN-20
    }));

    await prisma.coupon.createMany({
        data: coupons,
        skipDuplicates: true, // Avoid errors if duplicates exist
    });

    console.log("✅ Successfully added 20 coupons!");
}

main()
    .catch((e) => {
        console.error("Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = 12; // Number of coupons per page
    const search = url.searchParams.get("search") || ""; // Search query

    try {
        // Fetch coupons with pagination & search
        const coupons = await prisma.coupon.findMany({
            where: {
                code: { contains: search, mode: 'insensitive' }, // Case-insensitive search
            },
            orderBy: { id: 'asc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        // Get total count for pagination
        const totalCoupons = await prisma.coupon.count({
            where: { code: { contains: search, mode: 'insensitive' } },
        });

        return NextResponse.json({ coupons, page, totalCoupons, pageSize });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching coupons", error }, { status: 500 });
    }
}

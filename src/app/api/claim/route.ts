import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setCookie, getCookie } from 'cookies-next';

export async function POST(req: NextRequest) {
    try {
        const { couponCode } = await req.json();
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'; // Extract IP from headers
        const userCookie = await getCookie('coupon_claim', { req }) || Math.random().toString(36).substring(7);
        const oneHourAgo = BigInt(Date.now() - 3600000); // 1 hour in milliseconds

        if (!couponCode) {
            return NextResponse.json({ message: "Please select a valid coupon." }, { status: 400 });
        }

        // Check if user has already claimed a coupon in the last hour
        const existingClaim = await prisma.claim.findFirst({
            where: {
                OR: [{ ip }, { cookie: userCookie }],
                timestamp: { gt: oneHourAgo },
            },
        });

        if (existingClaim) {
            const timeRemaining = Math.ceil((Number(existingClaim.timestamp) + 3600000 - Date.now()) / 1000);
            return NextResponse.json({ 
                message: "You must wait before claiming again.", 
                timeRemaining 
            }, { status: 429 });
        }

        // Find the selected coupon
        const coupon = await prisma.coupon.findUnique({
            where: { code: couponCode },
        });

        if (!coupon) {
            return NextResponse.json({ message: "Coupon not available or already claimed." }, { status: 404 });
        }

        // Store claim record
        await prisma.claim.create({
            data: {
                ip,
                timestamp: BigInt(Date.now()),
                cookie: userCookie,
            },
        });

        // Remove the claimed coupon
        await prisma.coupon.delete({
            where: { id: coupon.id },
        });

        // Set cookie using `cookies-next`
        const response = NextResponse.json({ message: "Coupon claimed!", code: coupon.code });
        setCookie('coupon_claim', userCookie, { req, res: response, maxAge: 3600, path: '/' });

        return response;
    } catch (error: unknown) { 
        if (error instanceof Error) {
            console.error("Server error:", error.message);
            return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
        }
        return NextResponse.json({ message: "An unknown error occurred" }, { status: 500 });
    }
    
}

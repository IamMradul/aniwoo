import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/server/adminAuth';

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay payment details' },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: 'Razorpay secret missing' },
        { status: 500 }
      );
    }

    // Verify the signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Payment is successful, update the order status in Supabase
    if (supabaseAdmin) {
      const { error: dbError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          razorpay_payment_id,
          razorpay_signature,
        })
        .eq('razorpay_order_id', razorpay_order_id);

      if (dbError) {
        console.error('Error updating order status in Supabase:', dbError);
        // Even if DB fails, payment was authentic. We log the error.
      }
    }

    return NextResponse.json(
      { message: 'Payment verified successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

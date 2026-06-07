import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/server/adminAuth';

export async function POST(req: Request) {
  try {
    const { amount, currency, items, userId, deliveryAddress } = await req.json();

    if (!amount || !items) {
      return NextResponse.json(
        { error: 'Amount and items are required' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay credentials missing in environment' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create an order in Razorpay.
    // Razorpay amount is in the smallest currency unit (paise for INR).
    const options = {
      amount: Math.round(amount * 100),
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    if (!razorpayOrder) {
      return NextResponse.json(
        { error: 'Failed to create Razorpay order' },
        { status: 500 }
      );
    }

    // Save order in Supabase using admin client since RLS might block unauthenticated/mismatched inserts if not fully wired up,
    // or if we just want to bypass RLS for this backend operation.
    if (supabaseAdmin) {
      const { data: orderData, error: dbError } = await supabaseAdmin
        .from('orders')
        .insert([
          {
            user_id: userId || null,
            amount: amount,
            currency: currency || 'INR',
            status: 'created',
            razorpay_order_id: razorpayOrder.id,
            items: items,
            delivery_address: deliveryAddress || null,
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Error inserting order into Supabase:', dbError);
        // We can still proceed with payment, but we won't have a record of it.
        // It's better to fail if DB fails.
        return NextResponse.json(
          { error: 'Failed to save order in database' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

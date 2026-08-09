import { NextRequest, NextResponse } from 'next/server';
import { updateLoan, deleteLoan } from '@/lib/actions/loans';
import { loanSchema } from '@/lib/validations/loan';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parseResult = loanSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const result = await updateLoan(id, parseResult.data);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteLoan(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

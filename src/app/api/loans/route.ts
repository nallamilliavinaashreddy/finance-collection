import { NextRequest, NextResponse } from 'next/server';
import { getLoans, createLoan } from '@/lib/actions/loans';
import { loanSchema } from '@/lib/validations/loan';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || 'all';

  const result = await getLoans(q, status);
  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Failed to fetch loans' }, { status: 400 });
  }

  return NextResponse.json({ data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = loanSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const result = await createLoan(parseResult.data);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCollections, createCollection } from '@/lib/actions/collections';
import { collectionSchema } from '@/lib/validations/collection';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const date = searchParams.get('date') || '';

    const result = await getCollections(query, date);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = collectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const result = await createCollection(validation.data);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to record collection' },
      { status: 500 }
    );
  }
}

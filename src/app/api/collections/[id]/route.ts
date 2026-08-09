import { NextRequest, NextResponse } from 'next/server';
import { deleteCollection } from '@/lib/actions/collections';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Collection ID is required' }, { status: 400 });
    }

    const result = await deleteCollection(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Collection record deleted' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete collection' },
      { status: 500 }
    );
  }
}

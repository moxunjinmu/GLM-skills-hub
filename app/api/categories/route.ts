import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/categories
 * 获取所有分类列表
 */
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
      include: {
        _count: {
          select: {
            skills: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取分类列表失败',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/skills/[slug]
 * 获取单个 Skill 详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const skill = await prisma.skill.findUnique({
      where: { slug: slug ?? '' },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            nameZh: true,
            slug: true,
            icon: true,
            color: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            nameZh: true,
            slug: true,
            type: true,
          },
        },
      },
    });

    if (!skill) {
      return NextResponse.json(
        {
          success: false,
          error: 'Skill not found',
        },
        { status: 404 }
      );
    }

    // 增加浏览次数
    await prisma.skill.update({
      where: { id: skill.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: skill,
    });
  } catch (error) {
    console.error('Error fetching skill:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取 Skill 详情失败',
      },
      { status: 500 }
    );
  }
}

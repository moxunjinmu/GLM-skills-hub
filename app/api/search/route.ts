import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/search
 * 搜索 Skills，支持关键词、高级筛选
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 解析查询参数
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category') || '';
    const tags = searchParams.get('tags')?.split(',') || [];
    const sort = searchParams.get('sort') || 'relevance';

    // 计算 skip 和 take
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      isActive: true,
    };

    // 搜索条件
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { nameZh: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { descriptionZh: { contains: q, mode: 'insensitive' } },
        { repository: { contains: q, mode: 'insensitive' } },
      ];
    }

    // 分类筛选
    if (category) {
      where.categories = {
        some: {
          slug: category,
        },
      };
    }

    // 标签筛选（多个标签 OR 关系）
    if (tags.length > 0) {
      where.tags = {
        some: {
          slug: {
            in: tags,
          },
        },
      };
    }

    // 排序条件
    let orderBy: any = {};
    switch (sort) {
      case 'stars':
        orderBy = { stars: 'desc' };
        break;
      case 'rating':
        orderBy = [{ rating: 'desc' }, { ratingCount: 'desc' }];
        break;
      case 'latest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'relevance':
      default:
        // 按综合评分排序 (stars * 0.3 + rating * 0.3 + usageCount * 0.2 + viewCount * 0.2)
        orderBy = [{ stars: 'desc' }, { rating: 'desc' }];
        break;
    }

    // 查询总数
    const total = await prisma.skill.count({ where });

    // 查询数据
    const skills = await prisma.skill.findMany({
      where,
      orderBy,
      skip,
      take: limit,
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

    // 返回结果
    return NextResponse.json({
      success: true,
      data: {
        query: q,
        skills,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error searching skills:', error);
    return NextResponse.json(
      {
        success: false,
        error: '搜索失败',
      },
      { status: 500 }
    );
  }
}

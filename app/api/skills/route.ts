import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/skills
 * 获取 Skills 列表，支持筛选、排序和分页
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 解析查询参数
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const tag = searchParams.get('tag') || '';
    const sort = searchParams.get('sort') || 'latest'; // latest, stars, rating, usage
    const isOfficial = searchParams.get('isOfficial') === 'true';
    const featured = searchParams.get('featured') === 'true';

    // 计算 skip 和 take
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      isActive: true,
    };

    // 搜索条件
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameZh: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { descriptionZh: { contains: search, mode: 'insensitive' } },
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

    // 标签筛选
    if (tag) {
      where.tags = {
        some: {
          slug: tag,
        },
      };
    }

    // 官方筛选
    if (isOfficial) {
      where.isOfficial = true;
    }

    // 精选筛选
    if (featured) {
      where.featured = true;
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
      case 'usage':
        orderBy = { usageCount: 'desc' };
        break;
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' };
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
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取 Skills 列表失败',
      },
      { status: 500 }
    );
  }
}

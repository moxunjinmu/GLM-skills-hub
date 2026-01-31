import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import { chat, callZhipuAPI } from '@/lib/zhipu/client'

const TRIAL_COST = 20 // 每次试用消耗积分
const MAX_TOKENS = 4096 // 最大 token 数

/**
 * POST /api/trials
 * 在线试用技能
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: '未授权', message: '请先登录后再试用技能' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { skillId, userInput } = body

    // 验证必填字段
    if (!skillId) {
      return NextResponse.json(
        { error: '缺少参数', message: 'skillId 是必填项' },
        { status: 400 }
      )
    }

    if (!userInput || userInput.trim().length === 0) {
      return NextResponse.json(
        { error: '缺少参数', message: 'userInput 是必填项' },
        { status: 400 }
      )
    }

    // 获取技能信息
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    })

    if (!skill) {
      return NextResponse.json(
        { error: '技能不存在', message: '指定的技能不存在' },
        { status: 404 }
      )
    }

    // 获取用户积分
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    })

    if (!user || user.credits < TRIAL_COST) {
      return NextResponse.json(
        {
          error: '积分不足',
          message: `积分不足，需要 ${TRIAL_COST} 积分/次试用。当前积分: ${user?.credits || 0}`,
        },
        { status: 402 }
      )
    }

    // 构建系统提示词
    const systemPrompt = `你是一个 AI Agent 技能助手，正在演示 "${skill.nameZh || skill.name}" 技能的使用。

技能描述：
${skill.descriptionZh || skill.description}

${skill.skillMdContent ? `技能使用说明：
${skill.skillMdContent}` : ''}

请根据用户的输入，使用该技能来回答用户的问题。如果用户的问题与该技能无关，请礼貌地引导用户使用相关技能。`

    // 调用智谱 API
    let apiResponse: string
    let tokensUsed = 0

    try {
      const startTime = Date.now()

      // 设置 30 秒超时
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API 调用超时（30秒）')), 30000)
      )

      const apiCallPromise = callZhipuAPI({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput },
        ],
        maxTokens: MAX_TOKENS,
      })

      const response = await Promise.race([apiCallPromise, timeoutPromise]) as any
      apiResponse = response.choices[0].message.content
      tokensUsed = response.usage?.total_tokens || 0

      console.log(`[Trial] Skill: ${skill.name}, Tokens: ${tokensUsed}, Time: ${Date.now() - startTime}ms`)
    } catch (error: any) {
      console.error('[Trial] 智谱 API 调用失败:', error)

      // 如果是超时，返回部分结果
      if (error.message.includes('超时')) {
        apiResponse = '抱歉，响应时间过长，请稍后重试。建议使用更简洁的问题描述。'
        tokensUsed = 0
      } else {
        throw error
      }
    }

    // 扣除积分
    await prisma.$transaction(async (tx) => {
      // 更新用户积分
      await tx.user.update({
        where: { id: session.user.id },
        data: { credits: { decrement: TRIAL_COST } },
      })

      // 记录积分日志
      await tx.creditLog.create({
        data: {
          userId: session.user.id,
          amount: -TRIAL_COST,
          reason: 'TRIAL_USE',
          description: `试用技能：${skill.name}`,
          metadata: {
            skillId,
            skillName: skill.name,
            tokensUsed,
          },
        },
      })

      // 记录使用日志
      await tx.usageLog.create({
        data: {
          userId: session.user.id,
          skillId,
          action: 'TRIAL',
          creditsCost: TRIAL_COST,
          metadata: {
            userInput: userInput.substring(0, 500), // 只保存前500字符
            responseLength: apiResponse.length,
            tokensUsed,
          },
        },
      })

      // 更新技能使用次数
      await tx.skill.update({
        where: { id: skillId },
        data: { usageCount: { increment: 1 } },
      })
    })

    return NextResponse.json({
      success: true,
      message: '试用成功',
      data: {
        response: apiResponse,
        tokensUsed,
        creditsCost: TRIAL_COST,
        remainingCredits: (user?.credits || 0) - TRIAL_COST,
      },
    })
  } catch (error) {
    console.error('试用失败:', error)

    // 判断错误类型
    if (error instanceof Error) {
      if (error.message.includes('ZHIPU_API_KEY')) {
        return NextResponse.json(
          { error: '配置错误', message: '智谱 API Key 未配置，请联系管理员' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: '服务器错误', message: '试用失败，请稍后重试' },
      { status: 500 }
    )
  }
}

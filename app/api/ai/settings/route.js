import prisma from '../../../../lib/prisma'
import { jsonResponse, errorResponse } from '../../../../lib/api'
import { createAuditLog } from '../../../../lib/audit'
import { protectInternalMutation, getActorKeyFromContext } from '../../../../lib/internal-security'
import { requireTenantContext } from '../../../../lib/request-context'
import { readSanitizedJson, sanitizeString } from '../../../../lib/request-security'
import { getAISettingsWithUsage } from '../../../../lib/ai-copilot'

export const dynamic = 'force-dynamic'

const DEFAULT_SETTINGS = {
  provider: 'openai',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 1000,
  language: 'es',
  personality: '',
  systemPrompt: '',
  dailyLimit: 0,
  monthlyLimit: 0,
  costPer1kInput: 0,
  costPer1kOutput: 0,
  isActive: true,
}

function toSafeNumber(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function normalizeCustomPrompts(customPrompts) {
  if (!customPrompts || typeof customPrompts !== 'object' || Array.isArray(customPrompts)) {
    return {}
  }

  return customPrompts
}

function serializeAISettings(record) {
  const customPrompts = normalizeCustomPrompts(record?.customPrompts)

  return {
    ...DEFAULT_SETTINGS,
    provider: record?.provider || DEFAULT_SETTINGS.provider,
    model: record?.model || DEFAULT_SETTINGS.model,
    temperature: record?.temperature ?? DEFAULT_SETTINGS.temperature,
    maxTokens: record?.maxTokens ?? DEFAULT_SETTINGS.maxTokens,
    language: record?.language || DEFAULT_SETTINGS.language,
    personality: record?.personality || '',
    systemPrompt: customPrompts.systemPrompt || '',
    dailyLimit: toSafeNumber(customPrompts.dailyLimit, 0),
    monthlyLimit: toSafeNumber(customPrompts.monthlyLimit, 0),
    costPer1kInput: toSafeNumber(customPrompts.costPer1kInput, 0),
    costPer1kOutput: toSafeNumber(customPrompts.costPer1kOutput, 0),
    isActive: record?.isActive ?? true,
    hasApiKey: Boolean(record?.apiKey),
    apiKey: '',
  }
}

export async function GET(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const { settings, usage } = await getAISettingsWithUsage(context.tenantId)

    return jsonResponse({
      settings: serializeAISettings(settings),
      usage,
    })
  } catch (error) {
    console.error('Error fetching AI settings:', error)
    return errorResponse('No se pudo obtener la configuración de IA.')
  }
}

export async function PUT(req) {
  try {
    const tenantResult = await requireTenantContext(req, { allowApiKey: false })
    if (!tenantResult.ok) {
      return tenantResult.error
    }

    const { context } = tenantResult
    const protection = protectInternalMutation({
      req,
      scope: 'ai-settings:update',
      actorKey: getActorKeyFromContext(context),
      max: 10,
      windowMs: 60_000,
    })

    if (!protection.ok) {
      return protection.error
    }

    const payload = await readSanitizedJson(req)
    const previousSetting = await prisma.aISetting.findUnique({
      where: { tenantId: context.tenantId },
    })

    const nextCustomPrompts = {
      ...normalizeCustomPrompts(previousSetting?.customPrompts),
      systemPrompt: sanitizeString(payload.systemPrompt),
      dailyLimit: Math.max(0, Math.floor(toSafeNumber(payload.dailyLimit, 0))),
      monthlyLimit: Math.max(0, Math.floor(toSafeNumber(payload.monthlyLimit, 0))),
      costPer1kInput: Math.max(0, toSafeNumber(payload.costPer1kInput, 0)),
      costPer1kOutput: Math.max(0, toSafeNumber(payload.costPer1kOutput, 0)),
      actionGuardEnabled: true,
    }

    const nextSetting = await prisma.aISetting.upsert({
      where: { tenantId: context.tenantId },
      create: {
        tenantId: context.tenantId,
        provider: sanitizeString(payload.provider) || DEFAULT_SETTINGS.provider,
        model: sanitizeString(payload.model) || DEFAULT_SETTINGS.model,
        temperature: Math.min(2, Math.max(0, toSafeNumber(payload.temperature, DEFAULT_SETTINGS.temperature))),
        maxTokens: Math.max(128, Math.floor(toSafeNumber(payload.maxTokens, DEFAULT_SETTINGS.maxTokens))),
        language: sanitizeString(payload.language) || DEFAULT_SETTINGS.language,
        personality: sanitizeString(payload.personality) || null,
        customPrompts: nextCustomPrompts,
        apiKey: sanitizeString(payload.apiKey) || null,
        isActive: payload.isActive !== false,
      },
      update: {
        provider: sanitizeString(payload.provider) || DEFAULT_SETTINGS.provider,
        model: sanitizeString(payload.model) || DEFAULT_SETTINGS.model,
        temperature: Math.min(2, Math.max(0, toSafeNumber(payload.temperature, DEFAULT_SETTINGS.temperature))),
        maxTokens: Math.max(128, Math.floor(toSafeNumber(payload.maxTokens, DEFAULT_SETTINGS.maxTokens))),
        language: sanitizeString(payload.language) || DEFAULT_SETTINGS.language,
        personality: sanitizeString(payload.personality) || null,
        customPrompts: nextCustomPrompts,
        apiKey: sanitizeString(payload.apiKey) || previousSetting?.apiKey || null,
        isActive: payload.isActive !== false,
      },
    })

    await createAuditLog({
      tenantId: context.tenantId,
      userId: context.actingUserId,
      action: 'ai.settings.updated',
      entity: 'AISetting',
      entityId: nextSetting.id,
      oldData: previousSetting
        ? {
            ...previousSetting,
            apiKey: previousSetting.apiKey ? '***' : null,
          }
        : null,
      newData: {
        ...nextSetting,
        apiKey: nextSetting.apiKey ? '***' : null,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    })

    const { settings, usage } = await getAISettingsWithUsage(context.tenantId)

    return jsonResponse({
      settings: serializeAISettings(settings),
      usage,
      message: 'Configuración de IA guardada correctamente.',
    }, 200, protection.headers)
  } catch (error) {
    console.error('Error saving AI settings:', error)
    return errorResponse('No se pudo guardar la configuración de IA.')
  }
}

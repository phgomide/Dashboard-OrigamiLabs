import { assertNoError, requireSupabase } from './repository'

export interface SettingOption {
  id: string
  category: string
  label: string
  value: string
  color?: string
  orderIndex: number
  isActive: boolean
}

type SettingRow = Record<string, unknown>

function settingFromRow(row: SettingRow): SettingOption {
  return {
    id: String(row.id),
    category: String(row.category),
    label: String(row.label),
    value: String(row.value),
    color: row.color ? String(row.color) : undefined,
    orderIndex: Number(row.order_index),
    isActive: Boolean(row.is_active),
  }
}

function settingToRow(value: Omit<SettingOption, 'id'>) {
  return {
    category: value.category.trim().slice(0, 80),
    label: value.label.trim().slice(0, 120),
    value: value.value.trim().slice(0, 120),
    color: value.color ?? null,
    order_index: value.orderIndex,
    is_active: value.isActive,
  }
}

export async function listSettings() {
  const { data, error } = await requireSupabase().from('settings_options').select('*').order('category').order('order_index')
  assertNoError(error)
  return (data ?? []).map((row) => settingFromRow(row as SettingRow))
}

export async function createSetting(value: Omit<SettingOption, 'id'>) {
  const { data, error } = await requireSupabase().from('settings_options').insert(settingToRow(value)).select().single()
  assertNoError(error)
  return settingFromRow(data as SettingRow)
}

export async function deleteSetting(id: string) {
  const { error } = await requireSupabase().from('settings_options').delete().eq('id', id)
  assertNoError(error)
}

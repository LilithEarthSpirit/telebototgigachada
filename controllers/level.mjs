import environment from "../environment/index.mjs"
import { FbUtils } from "../utils/index.mjs"

export const getAll = async () => {
  try {
    const res = await fetch(`${environment.fbDbUrl}/level.json`)
    const data = await res.json()
    return FbUtils.normalizeData(data)
  } catch (err) {
    console.log('[GET_ALL_LEVELS]: ', err)
  }
}

export const getTitles = async () => {
  const levels = await getAll()
  return levels.map(level => level.name)
}
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

export const getAllWithTasks = async () => {
  try {
    const levels = await getAll()
    // const tasks = []
    // for (const level of levels) {
    //   level.tasks.forEach(taskId => {
    //     const rawTask = await fetch(`${environment.fbDbUrl}/tasks/${taskId}.json`)
    //   })
    // }
  } catch (err) {
    console.log(err)
  }
}
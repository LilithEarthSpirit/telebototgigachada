import environment from '../environment/index.mjs'
import { LevelController } from './index.mjs'

export const getAllByLevel = async (levelName, type) => {
  try {
    const levels = await LevelController.getAll()
    const level = levels.find((l) => l.name === levelName)

    const tasks = []
    for (const taskId of level.tasks) {
      const rawRes = await fetch(`${environment.fbDbUrl}/tasks/${taskId}.json`)
      const task = await rawRes.json()
      if (task.type === type) {
        tasks.push(task)
      }
    }
    return tasks
  } catch (err) {
    console.log(err)
  }
}

const getOneByLevel = async (levelName, offset, type) => {
  const tasks = await getAllByLevel(levelName, type)
  return { ...tasks[offset], size: tasks.length }
}

export const getOneWithButtons = async (
  levelName,
  offset,
  rightLength,
  type
) => {
  const task = await getOneByLevel(levelName, offset, type)
  console.log('task: ', task)
  const buttons = task.answers.reduce((acc, variant, idx) => {
    acc.push({
      text: variant,
      callback_data: JSON.stringify({
        qa: `${idx}_${task.answer}_${levelName}`,
        size: task.size,
        offset,
        rightLength,
      }),
    })
    return acc
  }, [])
  return { ...task, buttons: [buttons] }
}

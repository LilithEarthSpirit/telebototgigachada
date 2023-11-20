import environment from "../environment/index.mjs"
import { LevelController } from "./index.mjs"

export const getAllByLevel = async (levelName) => {
  try {
    const levels = await LevelController.getAll()
    const level = levels.find(l => l.name === levelName)

    const tasks = []
    for (const taskId of level.tasks) {
      const rawRes = await fetch(`${environment.fbDbUrl}/tasks/${taskId}.json`)
      const task = await rawRes.json()
      tasks.push(task)
    }
    return tasks
  } catch (err) {
    console.log(err)
  }
}

const getOneByLevel = async (levelName, offset) => {
  const tasks = await getAllByLevel(levelName)
  return {...tasks[offset], size: tasks.length}
}

export const getOneWithButtons = async (levelName, offset, rightLength) => {
  const task = await getOneByLevel(levelName, offset)
  const buttons = task.answers.reduce((acc, variant, idx) => {
    acc.push({
      text: variant,
      callback_data: JSON.stringify({
        qa: `${idx}_${task.answer}_${levelName}`,
        size: task.size,
        offset,
        rightLength
      }),
    })
    return acc
  }, [])
  return { ...task, buttons: [buttons] }
}

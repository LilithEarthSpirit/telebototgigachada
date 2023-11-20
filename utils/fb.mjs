export const normalizeData = (data) =>
  Object.keys(data).map((key) => ({ ...data[key], id: key }))
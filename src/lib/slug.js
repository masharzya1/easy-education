export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export const isFirebaseId = (str) => {
  return /^[a-zA-Z0-9]{20,}$/.test(str)
}

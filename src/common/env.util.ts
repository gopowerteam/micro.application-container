export const isDevEnv = () => {
  return process.env.NODE_ENV === 'development'
}

export const isProdEnv = () => {
  return process.env.NODE_ENV === 'production'
}

export const getCurrentEnv = () => {
  return process.env.NODE_ENV || 'development'
}

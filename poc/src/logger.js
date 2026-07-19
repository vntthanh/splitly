const write = (level, event, context = {}) => {
  const safeContext = Object.fromEntries(
    Object.entries(context).filter(([key]) => !/key|token|base64|rawText|image/i.test(key))
  )
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...safeContext }))
}

export const logger = {
  info: (event, context) => write('info', event, context),
  error: (event, context) => write('error', event, context),
}

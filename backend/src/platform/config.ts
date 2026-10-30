/** Typed, validated configuration. The process refuses to start with a missing or malformed value. */
export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'staging' | 'production'
  port: number
  databaseUrl: string
  redisUrl: string
}

export class ConfigError extends Error {}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const problems: string[] = []
  const nodeEnv = (env.NODE_ENV ?? 'development') as AppConfig['nodeEnv']
  if (!['development', 'test', 'staging', 'production'].includes(nodeEnv)) problems.push(`NODE_ENV must be development|test|staging|production, got "${nodeEnv}"`)

  const port = Number(env.PORT ?? 3000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) problems.push('PORT must be an integer between 1 and 65535')

  const databaseUrl = env.DATABASE_URL ?? ''
  if (!/^postgres(ql)?:\/\//.test(databaseUrl)) problems.push('DATABASE_URL must be a postgres:// connection string')

  const redisUrl = env.REDIS_URL ?? ''
  if (!/^rediss?:\/\//.test(redisUrl)) problems.push('REDIS_URL must be a redis:// or rediss:// URL')

  if (problems.length) throw new ConfigError(`Invalid configuration:\n- ${problems.join('\n- ')}`)
  return { nodeEnv, port, databaseUrl, redisUrl }
}

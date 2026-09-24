// deno-lint-ignore-file

export interface TypeConfigDebug {
  agent?: string,
  model?: string,
  prompt?: string,

  host?: string,
  port?: any,
}

export interface TypeConfigModel {
  name?: string,
  config?: Record<string, any>,
}

export interface TypeConfigAgent {
  url?: string,
  key?: string,
  models?: Record<string, TypeConfigModel>,
}

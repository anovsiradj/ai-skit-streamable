export interface TypeConfigModel {
  name?: string,
  config?: Record<string, any>,
}

export interface TypeConfigAgent {
  url?: string,
  key?: string,
  models?: Record<string, TypeConfigModel>,
}

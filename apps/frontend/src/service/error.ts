export class HanaError extends Error {
  public status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HanaError'
    this.status = status
  }
}

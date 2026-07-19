import fs from 'node:fs/promises'
import path from 'node:path'

export class JsonBillStore {
  constructor(filePath) {
    this.filePath = filePath
    this.bills = new Map()
    this.writeChain = Promise.resolve()
  }

  async initialize() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    try {
      const records = JSON.parse(await fs.readFile(this.filePath, 'utf8'))
      records.forEach((bill) => this.bills.set(bill.id, bill))
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  async create(bill) {
    this.writeChain = this.writeChain.then(async () => {
      const next = new Map(this.bills)
      next.set(bill.id, bill)
      const temporaryFile = `${this.filePath}.tmp`
      await fs.writeFile(temporaryFile, `${JSON.stringify([...next.values()], null, 2)}\n`, { mode: 0o600 })
      await fs.rename(temporaryFile, this.filePath)
      this.bills = next
    })
    await this.writeChain
    return bill
  }

  findById(id) {
    return this.bills.get(id) ?? null
  }
}

const form = document.querySelector('#receipt-form')
const input = document.querySelector('#file')
const preview = document.querySelector('#preview')
const status = document.querySelector('#status')
const result = document.querySelector('#result')
const warnings = document.querySelector('#warnings')

input.addEventListener('change', () => {
  const file = input.files[0]
  if (!file) return
  preview.src = URL.createObjectURL(file)
  preview.hidden = false
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const button = form.querySelector('button')
  button.disabled = true
  status.textContent = 'Processing receipt…'
  result.hidden = true
  warnings.hidden = true

  try {
    const body = new FormData()
    body.set('file', input.files[0])
    const response = await fetch('/api/poc/receipts/process', { method: 'POST', body })
    const payload = await response.json()
    if (!response.ok) throw new Error(`${payload.error.code}: ${payload.error.message}`)
    document.querySelector('#extracted').textContent = JSON.stringify(payload.extractedData, null, 2)
    document.querySelector('#bill').textContent = JSON.stringify(payload.bill, null, 2)
    warnings.textContent = payload.warnings.length ? `Warnings: ${payload.warnings.join(', ')}` : 'No validation warnings.'
    warnings.className = payload.warnings.length ? 'warning' : 'success'
    warnings.hidden = false
    result.hidden = false
    status.textContent = `Bill ${payload.bill.id} was created and saved.`
  } catch (error) {
    status.textContent = error.message
  } finally {
    button.disabled = false
  }
})

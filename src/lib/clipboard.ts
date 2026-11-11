/**
 * Clipboard writing, with a fallback for the browsers that refuse the async API.
 *
 * Shared by the tools that hand a generated value back to the visitor. The
 * fallback is the old selection trick, because `navigator.clipboard` needs a
 * secure context and can be refused by permissions, and a generator that can
 * only be copied by hand is a worse tool than one that cannot.
 */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    /* falls through to the selection trick, usually a permissions refusal */
  }
  const scratch = document.createElement('textarea')
  scratch.value = text
  scratch.setAttribute('readonly', '')
  scratch.style.position = 'fixed'
  scratch.style.top = '-1000px'
  document.body.appendChild(scratch)
  scratch.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }
  scratch.remove()
  return copied
}

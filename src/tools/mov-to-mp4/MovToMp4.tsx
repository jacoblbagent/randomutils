import ConvertQueue from '../video/ConvertQueue/ConvertQueue'
import { MOV_SPEC } from './spec'

/**
 * MOV → MP4. The page is the shared converter queue (src/tools/video/) plus the QuickTime spec:
 * no size floor, no sidecars, a poster frame per row, and audio copied without the ADTS fix.
 */
export default function MovToMp4() {
  return <ConvertQueue spec={MOV_SPEC} />
}
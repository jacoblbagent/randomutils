import ConvertQueue from '../video/ConvertQueue/ConvertQueue'
import { TS_SPEC } from './spec'

/**
 * TS → MP4. The page is the shared converter queue (src/tools/video/) plus the MPEG-TS spec:
 * a 50 MB floor, DVR `.star` flags and same-named .jpg thumbnails, ADTS-fixed AAC copies.
 */
export default function TsToMp4() {
  return <ConvertQueue spec={TS_SPEC} />
}
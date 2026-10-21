import { Link } from 'react-router-dom'
import ToolGuide from '../../components/ToolGuide/ToolGuide'
import ConvertQueue from '../video/ConvertQueue/ConvertQueue'
import { TS_SPEC, MIN_SIZE_MB } from './spec'

/**
 * TS → MP4. The page is the shared converter queue (src/tools/video/) plus the MPEG-TS spec:
 * a 50 MB floor, DVR `.star` flags and same-named .jpg thumbnails, ADTS-fixed AAC copies.
 * Under the tool sits the guide — what a .ts actually is, when a copy is safe, and the failures
 * people hit — so the page is worth reading before it is worth using.
 */
export default function TsToMp4() {
  return (
    <>
      <ConvertQueue spec={TS_SPEC} />

      <ToolGuide heading="About this tool">
        <section className="doc__section">
          <h2>What a .ts file is</h2>
          <p>
            A <code>.ts</code> file is an MPEG transport stream: the container broadcasters and
            tuners write because it is built to survive a lossy signal. Instead of an index at
            the head of the file, as MP4 has, it is a continuous run of small fixed-size packets,
            which lets a receiver tune in mid-stream and start playing. That design is why a
            recording plays fine in VLC and awkwardly — or not at all — in QuickTime, in most
            phones, and in editors that expect a seekable file. Nothing is wrong with the video
            inside; the wrapper is the whole problem, and moving it into MP4 is what this tool
            does.
          </p>
          <p>
            You will usually meet one of three things, and they are the same conversion here:
            a capture from a network tuner such as an HDHomeRun, a recording pulled off a cable
            box or DVR, or an over-the-air capture. Files named <code>.mts</code> or{' '}
            <code>.m2ts</code> are the same family under different initials — AVCHD camcorders
            and Blu-ray use those extensions, and this tool takes all three.
          </p>
        </section>

        <section className="doc__section">
          <h2>Stream copy or re-encode?</h2>
          <p>
            <strong>Auto</strong> is the right answer almost every time: it copies the video and
            audio across untouched where they are already playable in an MP4, and re-encodes only
            the parts that are not. A copy is lossless and limited by your disk rather than your
            processor, so a two-hour recording finishes in seconds.
          </p>
          <ul>
            <li>
              <strong>Stream copy</strong> — force it when you know the recording is already
              H.264 or HEVC video with AAC audio and you want the fastest, pixel-identical
              result. If the video cannot legally sit in an MP4 it will fail outright rather than
              quietly re-encode behind your back, which is the point of choosing it.
            </li>
            <li>
              <strong>Re-encode</strong> — H.264 video and AAC audio, playable anywhere, but
              slow: roughly real time or worse on a laptop, and it discards the original quality
              in favour of compatibility. Reach for it when Auto produced a file that still will
              not play, or when you want the safest possible copy of an odd recording.
            </li>
          </ul>
        </section>

        <section className="doc__section">
          <h2>The 50 MB floor, and DVR .star files</h2>
          <ul>
            <li>
              Any <code>.ts</code> under {MIN_SIZE_MB} MB is skipped when you add it. Small files
              are almost always stubs, ad-break fragments or index scraps rather than real
              recordings, and converting them is noise. If a genuine clip is under the floor,
              the <Link to="/contact">contact page</Link> explains what to send.
            </li>
            <li>
              A <code>.star</code> file sitting next to a recording — <code>hdz_0000.ts.star</code>{' '}
              and the like — is a DVR sidecar naming the programme. Drop it in with the video and
              it is never converted itself; it just flags the matching row and rides along into
              the output name.
            </li>
            <li>
              A same-named <code>.jpg</code> becomes that row&rsquo;s thumbnail, since DVRs usually
              ship one beside each recording.
            </li>
          </ul>
        </section>

        <section className="doc__section">
          <h2>If something goes wrong</h2>
          <ul>
            <li>
              <strong>The MP4 plays but has no sound.</strong> The audio was probably AC-3, which
              MP4 players commonly refuse. Re-run that file with <strong>Re-encode</strong>.
            </li>
            <li>
              <strong>The picture shows comb-like lines on movement.</strong> The source is
              interlaced. <strong>Re-encode</strong> de-interlaces; a stream copy cannot.
            </li>
            <li>
              <strong>&ldquo;Stream copy failed.&rdquo;</strong> Expected — the video inside the
              stream is not MP4-legal. Auto or Re-encode handles it.
            </li>
            <li>
              <strong>A very large file stops part-way.</strong> The whole input and output sit
              in the page&rsquo;s memory, so a single recording over roughly 2 GB may run out of
              room. Split it first, or convert on a machine with more free memory.
            </li>
            <li>
              <strong>Dropping a file does nothing.</strong> Check the extension is{' '}
              <code>.ts</code>, <code>.mts</code> or <code>.m2ts</code>, and that the file is over{' '}
              {MIN_SIZE_MB} MB.
            </li>
          </ul>
          <p className="small-note">
            Still stuck? The <Link to="/contact">contact page</Link> lists exactly what to include
            so it can be worked out without sending the file.
          </p>
        </section>

        <section className="doc__section">
          <h2>Privacy, in one line</h2>
          <p>
            The conversion runs in this tab with FFmpeg compiled to WebAssembly, so the recording
            never leaves your machine — there is no upload step, and nothing is kept after you
            close the tab. The <Link to="/privacy">privacy page</Link> is the long version.
          </p>
        </section>
      </ToolGuide>
    </>
  )
}

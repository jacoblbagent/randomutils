import { Link } from 'react-router-dom'
import RelatedTools from '../../components/RelatedTools/RelatedTools'
import ToolGuide from '../../components/ToolGuide/ToolGuide'
import ConvertQueue from '../video/ConvertQueue/ConvertQueue'
import { MOV_SPEC } from './spec'

/**
 * MOV → MP4. The page is the shared converter queue (src/tools/video/) plus the QuickTime spec:
 * no size floor, no sidecars, a poster frame per row, and audio copied without the ADTS fix.
 * The guide below it covers what varies inside a .mov — which is a great deal — and what that
 * means for a copy versus a re-encode.
 */
export default function MovToMp4() {
  return (
    <>
      <ConvertQueue spec={MOV_SPEC} />

      <ToolGuide heading="About this tool">
        <section className="doc__section">
          <h2>What a .mov file is</h2>
          <p>
            A <code>.mov</code> file is a QuickTime movie: one of the oldest surviving media
            containers, and still the one Apple&rsquo;s cameras, phones and editors write by
            default. The container is organized much like an MP4 &mdash; it is read from its
            header, which is why a .mov seeks and scrubs cleanly &mdash; but it is far more
            permissive about what it will carry. That permissiveness is the whole story here: two
            files both ending in <code>.mov</code> can be as different inside as a text file and
            a photograph.
          </p>
        </section>

        <section className="doc__section">
          <h2>What copies and what gets re-encoded</h2>
          <p>
            The <strong>Auto</strong> method keeps whatever an MP4 player will accept, and
            re-encodes only the rest:
          </p>
          <ul>
            <li>
              <strong>Copied untouched</strong> — H.264 and HEVC video, and AAC or MP3 audio. This
              covers what an iPhone, an iPad or a screen recording produces, which is the
              overwhelming majority of what people drop in. A copy is lossless and takes seconds.
            </li>
            <li>
              <strong>Re-encoded</strong> — professional and camera codecs MP4 players refuse:
              ProRes, DV and Motion JPEG video, and PCM, ALAC and similar audio. These are
              high-quality formats that simply have no place in the MP4 specification, so the
              video is transcoded to H.264 and the audio to AAC.
            </li>
          </ul>
          <p>
            If you would rather not transcode anything, force <strong>Stream copy</strong> and let
            a ProRes or PCM file fail rather than be converted. If you want one file that will
            play anywhere without checking first, force <strong>Re-encode</strong>.
          </p>
        </section>

        <section className="doc__section">
          <h2>Where these .mov files come from</h2>
          <ul>
            <li>iPhone, iPad and Mac screen recordings, which are H.264 or HEVC and copy straight across.</li>
            <li>Camera and camcorder exports, often ProRes, which are converted.</li>
            <li>
              Video-editing exports &mdash; Final Cut, Premiere, DaVinci &mdash; which can be any
              of the above depending on how they were set to render.
            </li>
            <li>Old QuickTime movies, where the video may be DV or an even earlier codec.</li>
          </ul>
          <p className="small-note">
            There is no minimum size here, unlike the .ts tool: a .mov is already a finished file,
            and a two-second clip is a normal thing to convert.
          </p>
        </section>

        <section className="doc__section">
          <h2>If something goes wrong</h2>
          <ul>
            <li>
              <strong>The MP4 has silent, unfollowable sound or no audio at all.</strong> The
              audio was PCM or ALAC, which MP4 cannot carry. Re-run it with{' '}
              <strong>Re-encode</strong>.
            </li>
            <li>
              <strong>&ldquo;Stream copy failed.&rdquo;</strong> The file is ProRes, DV or similar
              &mdash; expected, and exactly what Auto fixes.
            </li>
            <li>
              <strong>The picture is very dark or washed out.</strong> Some camera footage carries
              a colour profile MP4 players read differently. A <strong>Re-encode</strong> usually
              normalizes it.
            </li>
            <li>
              <strong>A large file stops part-way.</strong> Input and output both sit in the
              page&rsquo;s memory; a single movie over roughly 2 GB may exhaust it.
            </li>
            <li>
              <strong>The file is a .mov but nothing happens.</strong> Check it is really a movie
              and not a mislabelled export; if in doubt, open it once in a player.
            </li>
          </ul>
          <p className="small-note">
            Still stuck? The <Link to="/contact">contact page</Link> lists exactly what to include.
          </p>
        </section>

        <section className="doc__section">
          <h2>Privacy, in one line</h2>
          <p>
            QuickTime movies are often the personal ones &mdash; family clips, screen recordings
            with something private on screen &mdash; which is a good reason this conversion runs
            in your browser and never uploads. The <Link to="/privacy">privacy page</Link> has the
            detail.
          </p>
        </section>
      </ToolGuide>

      <RelatedTools currentId="mov-to-mp4" />
    </>
  )
}

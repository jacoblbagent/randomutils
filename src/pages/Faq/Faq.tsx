import { Link } from 'react-router-dom'
import { SITE } from '../../config/site'
import { MIN_SIZE_MB } from '../../tools/ts-to-mp4/spec'
import './Faq.css'

/**
 * FAQ.
 *
 * The recurring questions from support mail, answered in one place instead of
 * being rediscovered in each tool's guide. Every answer here is a statement
 * about how the code actually behaves — the skip rules are in
 * `ConvertQueue.addFiles` and the tool specs, the engine recycling thresholds
 * are `RECYCLE_EVERY_FILES` / `RECYCLE_EVERY_BYTES` in `useFFmpeg.ts`. If one
 * of those numbers moves, this page moves with it.
 */
export default function Faq() {
  return (
    <article className="doc faq">
      <header className="doc__head">
        <h1>Frequently asked questions</h1>
        <p className="doc__stamp">
          The short answers, and where in the site each one comes from.
        </p>
      </header>

      <p className="doc__lede">
        Everything below is about the tools as they are built, not a policy. Where a number is
        involved it is the number in the code.
      </p>

      <section className="doc__section">
        <h2>Why was my file skipped?</h2>
        <p>A file is not added to the queue for one of three reasons, and the toast says which:</p>
        <ul>
          <li>
            <strong>It is under {MIN_SIZE_MB} MB, on TS → MP4 only.</strong> Sizes that small are
            almost always a fragment or a failed recording rather than something worth converting.
            MOV → MP4 has no size floor, because a small QuickTime clip is a normal file.
          </li>
          <li>
            <strong>It is not a file the tool takes.</strong> TS → MP4 accepts <code>.ts</code>,{' '}
            <code>.mts</code> and <code>.m2ts</code>; MOV → MP4 accepts <code>.mov</code> and{' '}
            <code>.qt</code>; Video → Audio takes the common video containers (and audio files,
            which it simply re-exports). A same-named{' '}
            <code>.jpg</code>/<code>.png</code> beside a recording is used as its thumbnail and a{' '}
            <code>.star</code> sidecar becomes a flag on the row — neither is queued as a video.
          </li>
          <li>
            <strong>You removed it earlier.</strong> Removing a file from the list is remembered by
            name for that tool, so re-adding the same name does nothing. The note above the queue
            shows how many names are remembered, and its “Clear list” button forgets them.
          </li>
        </ul>
        <p>
          Nothing is skipped silently: a skipped file produces the toast naming the count and the
          reason.
        </p>
      </section>

      <section className="doc__section">
        <h2>Why does the engine reload in the middle of a batch?</h2>
        <p>
          FFmpeg runs as WebAssembly inside the page, and a wasm instance's memory only ever grows.
          Deleting the input and output from its virtual filesystem frees the files but not the
          ceiling the instance has already reached — so a long batch of large recordings eventually
          hits a memory trap. To avoid that, the engine is deliberately thrown away and reloaded,
          every six files or every ~1 GB of source video, whichever comes first.
        </p>
        <p>
          The same recycle happens immediately after you press cancel, and after any fatal wasm
          error, because a trapped instance cannot be trusted with the next file. The reload is
          quick: the core is bundled with the site (not fetched from a CDN) and the browser has
          already cached it, so you see the “loading” phase rather than a download.
        </p>
      </section>

      <section className="doc__section">
        <h2>Is anything uploaded?</h2>
        <p>
          No. There is no upload endpoint to send anything to, and no server holding your files.
          Each file is read by the browser, written into FFmpeg's in-page filesystem, converted
          there, and handed back to you as a download from a blob URL that exists only in this tab.
          Close the tab and the output is gone unless you saved it.
        </p>
        <p>
          The one third party the page loads is the Google AdSense script; what it and its cookies
          do is set out on the <Link to="/privacy">privacy page</Link>. Nothing about your files
          ever reaches it — the conversion code has no network call in it at all.
        </p>
      </section>

      <section className="doc__section">
        <h2>Are big batches safe?</h2>
        <p>
          Yes, with one practical limit. Files convert strictly one at a time, in name order, so a
          hundred-file queue is a queue rather than a hundred parallel jobs. The periodic engine
          recycle above is what keeps a long run from degrading.
        </p>
        <p>
          The limit is per file: the source and the result both sit in browser memory while a job
          runs, so a single file over roughly 2 GB can fail no matter how much free disk you have.
          Splitting a very large recording is the workaround. Also keep the tab open and awake —
          the queue lives in the page, so a reload or a crash loses it, which is why the browser
          warns you before you leave with files still in the list. Download finished files as you
          go if the batch matters.
        </p>
      </section>

      <section className="doc__section">
        <h2>Does it work offline, and can I install it?</h2>
        <p>
          Every tool is a page with no server round-trip in its conversion path, so once the page
          and its FFmpeg core have loaded it keeps working without a network — on a plane, or on a
          locked-down laptop where a conversion site would be blocked. The site also ships a web
          app manifest, so a browser that offers “Install” can put it in its own window like an
          app. Installing changes nothing about the privacy story: it is still this page, running
          on your machine.
        </p>
      </section>

      <section className="doc__section">
        <h2>What if the output will not play, or the conversion fails?</h2>
        <p>
          A failed row keeps the error and the FFmpeg log, and the file is left in the list so you
          can retry it with a different mode. “Auto” copies streams that are already compatible and
          re-encodes only what has to change; “Stream copy” is the fast, lossless option that fails
          when the codec inside cannot live in an MP4; “Re-encode” always works but is much slower.
          If a file fails in all three, it is usually damaged at the source.
        </p>
        <p>
          If something looks wrong that this page does not explain, email{' '}
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> with the file's codecs (the
          row's log has them) — the <Link to="/contact">contact page</Link> lists what to include.
        </p>
      </section>

      <section className="doc__section">
        <h2>Where can I read more?</h2>
        <p>
          Each tool has a guide below it covering its formats and modes, the{' '}
          <Link to="/about">about page</Link> explains why the site is built this way, and the{' '}
          <Link to="/terms">terms</Link> and <Link to="/privacy">privacy</Link> pages cover the
          rest.
        </p>
      </section>
    </article>
  )
}

import { Link } from 'react-router-dom'
import { SITE } from '../../config/site'
import { IconExternal } from '../../icons/Icons'
import './About.css'

/**
 * About.
 *
 * The page Google's reviewers and a cautious first-time visitor both look for:
 * what this site is, why the tools run the way they do, what it deliberately
 * does not do, and who is behind it. Everything here is a statement about how
 * the site is actually built (see src/tools/video/useFFmpeg.ts for the claim
 * that nothing is uploaded), so the wording has to stay true to the code.
 *
 * (Written for this site as built; it is not legal advice.)
 */
export default function About() {
  return (
    <article className="doc about">
      <header className="doc__head">
        <h1>About {SITE.name}</h1>
        <p className="doc__stamp">
          Run by {SITE.owner}, individually — no company behind it.
        </p>
      </header>

      <p className="doc__lede">
        {SITE.name} is a small set of single-purpose tools for everyday media annoyance:
        converting a DVR recording or a QuickTime clip into an MP4 that plays anywhere, and
        pulling the audio track out of a video. Each one does that one job and nothing else.
      </p>

      <section className="doc__section">
        <h2>What makes it different</h2>
        <p>
          The tools run entirely in your browser, on FFmpeg compiled to WebAssembly. That is a
          technical choice with a plain consequence: the file you drop in is read and rewritten
          on your own machine, and there is no upload step because there is no server to upload
          to. There are no accounts, no sign-up, no queue on someone else's disk, and no copy of
          your file anywhere you cannot see. Close the tab and it is gone.
        </p>
        <p>
          This matters most for exactly the files people convert here. A DVR recording may carry
          something you would rather not hand to a stranger, and a work clip may be confidential
          before it is shared. Sending either one to a random conversion website means trusting
          that site's promises about deleting it. Here there is nothing to trust, because
          nothing leaves your device.
        </p>
        <p>
          The other half of the same choice: the tools keep working on a plane, on a locked-down
          work laptop, or anywhere a conversion site would be blocked, because once the page has
          loaded there is no network call left to make.
        </p>
      </section>

      <section className="doc__section">
        <h2>What the site does not do</h2>
        <ul>
          <li>It does not upload, store, log or forward your files. There is no upload endpoint.</li>
          <li>It does not ask you to create an account, or even to give a name.</li>
          <li>It does not run analytics on your files, or on you: the only third party the page loads is the ad service.</li>
          <li>It does not install anything, ask for unusual permissions, or keep a copy after the tab closes.</li>
          <li>It does not put a watermark on the output or cap how many files you convert.</li>
        </ul>
        <p>
          What the browser does keep — a few preference toggles in local storage — is set out in
          full on the <Link to="/privacy">privacy page</Link>.
        </p>
      </section>

      <section className="doc__section">
        <h2>Where the tools came from</h2>
        <p>
          They started as one-off scripts for a real problem — a pile of DVR recordings that
          would not open in QuickTime, and a batch of clips that needed only their audio. Doing
          it with a desktop tool meant installing one, and doing it with a website meant handing
          over files that had no business leaving the machine. Running FFmpeg inside the page
          removed both problems at once, and the result was worth keeping and sharing.
        </p>
      </section>

      <section className="doc__section">
        <h2>How it is paid for</h2>
        <p>
          The site is free and has no paid tier. It is supported by advertising served by Google
          AdSense, which is the only third party the page loads. There are no sponsored
          recommendations, no affiliate links in the tool copy, and no attempt to sell you an
          upgrade. The ad service and the cookies it uses are described on the{' '}
          <Link to="/privacy">privacy page</Link>.
        </p>
      </section>

      <section className="doc__section">
        <h2>Open source, and how to reach me</h2>
        <p>
          The source is public — read it, file an issue, or run your own copy:{' '}
          <a href={SITE.repo} target="_blank" rel="noreferrer">
            github.com/{SITE.owner}
            <IconExternal />
          </a>
          . For a broken conversion, a format request, an ad question or a takedown, email{' '}
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>, or see the{' '}
          <Link to="/contact">contact page</Link> for exactly what to include. Replies are best
          effort, usually within a few days.
        </p>
      </section>

      <section className="doc__section">
        <h2>Using the site</h2>
        <p>
          The tools are free to use, provided as-is and without warranty, and your files stay
          yours. Those terms, in full, are on the <Link to="/terms">terms of use</Link>.
        </p>
      </section>
    </article>
  )
}

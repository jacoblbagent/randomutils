import { SITE } from '../../config/site'
import { IconExternal } from '../../icons/Icons'
import './Contact.css'

/**
 * Contact.
 *
 * One address, reachable without a GitHub account: a broken conversion needs
 * reporting, a format question needs answering, and ad review plus takedown and
 * abuse handling all assume an owner who can be reached. The GitHub repo stays
 * as a second route for people who prefer an issue.
 */
export default function Contact() {
  return (
    <article className="doc contact">
      <header className="doc__head">
        <h1>Contact</h1>
        <p className="doc__stamp">Run by {SITE.owner}, individually — no company behind it.</p>
      </header>

      <p className="doc__lede">
        Email{' '}
        <a className="contact__mail" href={`mailto:${SITE.contactEmail}`}>
          {SITE.contactEmail}
        </a>{' '}
        for anything about this site. It reaches the person who builds it; no GitHub account, form or
        sign-up is involved.
      </p>

      <section className="doc__section">
        <h2>Report a conversion that came out wrong</h2>
        <p>Include as much of this as you can, and it can usually be worked out without the file:</p>
        <ul>
          <li>Which tool — TS → MP4, MOV → MP4 or Video → Audio.</li>
          <li>The source format and roughly how the file was made (a DVR recording, an iPhone clip, a camera export).</li>
          <li>Your browser and version, and whether you are on desktop or mobile.</li>
          <li>What you expected and what you got — a file that will not play, no audio, a stall, an error message.</li>
          <li>
            Anything the browser's console reported. Open developer tools (F12) before you start the
            conversion and copy the error out.
          </li>
        </ul>
        <p className="small-note">
          If a file is small and you can share it, say so first — but never send anything private or
          confidential. Files are not needed to answer most questions.
        </p>
      </section>

      <section className="doc__section">
        <h2>Formats, features and ideas</h2>
        <p>
          Wanting another format or a missing option is a good reason to write. A short note on the format
          and what you need it for is enough; format requests are what most of these tools started as.
        </p>
      </section>

      <section className="doc__section">
        <h2>Advertising, business and takedown</h2>
        <p>
          For ad enquiries, licensing, press, copyright or takedown, and anything that needs a name and a
          paper trail, use the same address and put the site name and the subject in the subject line. Do
          the same for anything about the ads being shown here or a page that looks wrong or abusive.
        </p>
      </section>

      <section className="doc__section">
        <h2>Elsewhere</h2>
        <p>
          Source code, and a place to file an issue if you would rather use one:{' '}
          <a href={SITE.repo} target="_blank" rel="noreferrer">
            github.com/{SITE.owner}
            <IconExternal />
          </a>
          . What the tools do with your files is set out on the privacy page — the short version is that they
          never leave your browser.
        </p>
      </section>

      <section className="doc__section">
        <h2>Replies</h2>
        <p>
          Best effort, usually within a few days. Bug reports and format questions get answered first.
        </p>
      </section>
    </article>
  )
}

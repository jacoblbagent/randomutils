import { Link } from 'react-router-dom'
import { SITE } from '../../config/site'
import './Privacy.css'

/**
 * Privacy policy.
 *
 * Two jobs: state plainly what the tools do with your files (nothing leaves the
 * browser), and disclose the one third party the site actually loads — Google
 * AdSense. Ad review expects a linked privacy page on an ad-serving site, and
 * this is also the page a visitor checks against the "nothing is uploaded"
 * claim in the footer, so the wording here has to stay true to the code.
 *
 * Inline links to Google's own pages are deliberate: a visitor should be able
 * to reach the opt-out and the vendor policy in one hop.
 *
 * (This disclosure is written for this site as built; it is not legal advice.)
 */
export default function Privacy() {
  return (
    <article className="doc privacy">
      <header className="doc__head">
        <h1>Privacy policy</h1>
        <p className="doc__stamp">Last updated 21 October 2026</p>
      </header>

      <p className="doc__lede">
        {SITE.name} is a set of small tools that run inside your browser. The tools are the whole product:
        every file you open in one of them is processed on your own machine by FFmpeg compiled to
        WebAssembly. It is never uploaded, transmitted or stored anywhere — there is no account, no
        server-side processing, and no copy of your file leaves your device.
      </p>

      <section className="doc__section">
        <h2>What stays on your device</h2>
        <ul>
          <li>
            Files you drop into a converter are read locally to convert them. The results are produced in
            the page and handed straight back to you as downloads.
          </li>
          <li>
            The queue, the conversion and the results live only in the page's memory. Closing or reloading
            the tab discards them.
          </li>
          <li>
            A few preferences are saved in your browser's <code>localStorage</code> so a reload keeps
            them: the feature-flag switches (<code>randomutils.flags</code>), and each converter's starred
            files and &ldquo;previously removed&rdquo; list. They stay in your browser, are not sent
            anywhere, and clearing site data removes them.
          </li>
          <li>
            We have no way to see your files. There is no upload endpoint, no analytics on the files, and
            no copy of them on any server we control.
          </li>
        </ul>
      </section>

      <section className="doc__section">
        <h2>Advertising</h2>
        <p>
          The site is supported by advertising served by Google AdSense, which is the only third party the
          page loads. AdSense is a third-party ad vendor, and it uses cookies:
        </p>
        <ul>
          <li>Third-party vendors, including Google, use cookies to serve ads based on your visits to this site and other sites.</li>
          <li>Google's use of advertising cookies lets it and its partners show you ads based on your visit here and elsewhere on the internet.</li>
          <li>
            You can opt out of personalised advertising at{' '}
            <a href="https://adssettings.google.com/" target="_blank" rel="noreferrer">
              Google Ad Settings
            </a>
            . Google describes what it collects and how it uses it in its{' '}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer">
              advertising and partner-sites policy
            </a>
            .
          </li>
          <li>
            Other third-party vendors and ad networks may place or read cookies, or use web beacons, when an
            ad is served. Where the law requires consent for personalised advertising, that consent is
            collected by Google's consent tooling before personalised ads are shown; declining still shows
            ads, just not personalised ones.
          </li>
        </ul>
        <p>
          The site itself sets no cookie of its own, runs no analytics, and builds no profile of you. The
          publisher id used for ad serving is recorded publicly in{' '}
          <a href={`${SITE.url}/ads.txt`}>ads.txt</a>.
        </p>
      </section>

      <section className="doc__section">
        <h2>Hosting and server logs</h2>
        <p>
          The site is a static build hosted on GitHub Pages and served at{' '}
          <a href={SITE.url}>{SITE.url.replace('https://', '')}</a>. Serving a page normally means the host
          records the request — IP address, user agent, timestamp — for security and delivery. That logging
          is GitHub's, not ours; see GitHub's{' '}
          <a
            href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
            target="_blank"
            rel="noreferrer"
          >
            privacy statement
          </a>
          . We do not collect, store or process that data ourselves, and nothing in a tool session reaches
          the host at all.
        </p>
      </section>

      <section className="doc__section">
        <h2>Children</h2>
        <p>
          The site has no accounts, no uploads and no sign-up, and it is not directed at children. We do not
          knowingly collect personal information from anyone, including children.
        </p>
      </section>

      <section className="doc__section">
        <h2>Changes to this policy</h2>
        <p>
          If what the site loads or stores changes, this page changes with it and the date at the top moves
          forward. The current version is always the one served here.
        </p>
      </section>

      <section className="doc__section">
        <h2>Contact</h2>
        <p>
          Questions about this policy, a correction, or a privacy request (there is no data about you for us
          to hand over, but ask anyway) — see the{' '}
          <Link to="/contact">contact page</Link>, or email{' '}
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
        </p>
      </section>
    </article>
  )
}

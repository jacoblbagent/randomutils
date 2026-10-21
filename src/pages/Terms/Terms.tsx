import { Link } from 'react-router-dom'
import { SITE } from '../../config/site'
import './Terms.css'

/**
 * Terms of use.
 *
 * Plain-language terms for a free, no-account, browser-only tool. Three things
 * it has to say honestly, because the code says them first: the software is
 * provided as-is with no warranty, your files stay yours, and the site is
 * supported by advertising served by a third party. Nothing here promises more
 * than a static site with no backend can deliver.
 *
 * (Written for this site as built; it is not legal advice, and it does not
 * claim a jurisdiction the owner cannot back up.)
 */
export default function Terms() {
  return (
    <article className="doc terms">
      <header className="doc__head">
        <h1>Terms of use</h1>
        <p className="doc__stamp">Last updated 21 October 2026</p>
      </header>

      <p className="doc__lede">
        These are the terms for using {SITE.name}. They are short and written to be read. By
        using the site you accept them; if you do not, the fix is simply not to use it.
      </p>

      <section className="doc__section">
        <h2>What the site is</h2>
        <p>
          {SITE.name} is a free set of browser tools that convert media files. It runs entirely
          on your machine: the tools are downloaded to your browser and they stay there, so
          there is no service on our side performing the work and nothing for us to operate,
          staff or guarantee.
        </p>
      </section>

      <section className="doc__section">
        <h2>Your files stay yours</h2>
        <p>
          We claim no rights over anything you open in a tool. We never receive your files at
          all — the conversion happens in your browser — so there is nothing for us to copy,
          keep, license or disclose. You are responsible for having the right to work with the
          files you use, and for what you do with the results.
        </p>
      </section>

      <section className="doc__section">
        <h2>Provided as-is, without warranty</h2>
        <p>
          The tools are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, with no
          warranty of any kind, express or implied, including any warranty of merchantability,
          fitness for a particular purpose, or that a conversion will be accurate, complete or
          lossless. FFmpeg and your browser do the real work, and both can fail on an unusual
          file. Always keep the original file: it is the copy that matters, and a conversion is
          not a backup.
        </p>
      </section>

      <section className="doc__section">
        <h2>Acceptable use</h2>
        <ul>
          <li>Do not use the site to break the law, or to infringe anyone's copyright or other rights.</li>
          <li>Do not try to attack, overload, or interfere with the site or anyone else's use of it.</li>
          <li>
            Do not attempt to work around the tools' limitations in a way that depends on us
            storing or processing your files — we do not, and cannot.
          </li>
          <li>
            Automated bulk use of the site is your own affair (the tools run locally), but do not
            do it in a way that hammers the host or the ad service.
          </li>
        </ul>
      </section>

      <section className="doc__section">
        <h2>Advertising and third parties</h2>
        <p>
          The site is supported by advertising served by Google AdSense, the only third party the
          page loads. Those ads, and the cookies they use, are governed by Google's own terms and
          privacy policy — not by these terms. What the site loads and what it stores are set out
          on the <Link to="/privacy">privacy page</Link>, and the publisher id used for ad
          serving is recorded publicly in <a href={`${SITE.url}/ads.txt`}>ads.txt</a>.
        </p>
      </section>

      <section className="doc__section">
        <h2>Names and trademarks</h2>
        <p>
          Format and company names used on this site — MPEG, MP4, QuickTime, MOV, Apple, H.264,
          HEVC, WAV, MP3 and others — are the trademarks of their respective owners, and are used
          only to describe what a tool does. {SITE.name} is not affiliated with, endorsed by, or
          sponsored by any of them. FFmpeg is used under its own license; see the{' '}
          <a href={SITE.repo} target="_blank" rel="noreferrer">
            source repository
          </a>{' '}
          for the licenses and attributions that apply to the software.
        </p>
      </section>

      <section className="doc__section">
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent the law allows, {SITE.name} and its owner are not liable for any
          loss arising from your use of the site — including lost, corrupted or converted files,
          lost time, or any indirect or consequential damage. Because the service is free and
          runs on your own machine, the entire risk of using it sits with you.
        </p>
      </section>

      <section className="doc__section">
        <h2>Changes to these terms</h2>
        <p>
          If the site changes in a way these terms no longer describe, this page changes with it
          and the date at the top moves forward. The version served here is the current one, and
          continuing to use the site after a change means you accept it.
        </p>
      </section>

      <section className="doc__section">
        <h2>Contact</h2>
        <p>
          Questions about these terms, or a correction — email{' '}
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> or use the{' '}
          <Link to="/contact">contact page</Link>.
        </p>
        <p className="small-note">
          These terms are written for this site as built and are a plain description of how it
          works; they are not legal advice.
        </p>
      </section>
    </article>
  )
}

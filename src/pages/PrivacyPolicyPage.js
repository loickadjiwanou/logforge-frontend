import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
  <section className="mb-12">
    <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
    <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">{children}</div>
  </section>
);

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-16 pb-24 bg-zinc-950 min-h-screen">
      <div className="mx-auto px-6 max-w-3xl">

        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-8">
            <Shield className="w-4 h-4" /> Legal
          </div>
          <h1 className="text-5xl font-black text-white mb-6 tracking-tighter">
            Privacy <span className="text-emerald-500 italic">Policy</span>
          </h1>
          <p className="text-zinc-500 text-sm">
            Last updated: <span className="text-zinc-300">April 14, 2026</span>
          </p>
        </div>

        {/* Intro */}
        <div className="p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 mb-12">
          <p className="text-emerald-300 text-sm leading-relaxed">
            <strong className="font-semibold">LogForge is self-hosted by design.</strong> When you deploy LogForge on your own infrastructure, your logs, user data, and metadata never leave your servers — they are never sent to us. This policy covers the data we collect through this website and our hosted services only.
          </p>
        </div>

        <Section title="1. Who We Are">
          <p>
            LogForge ("we", "us", "our") is a developer-focused log management platform. Our mission is to give engineering teams full control over their observability stack without sacrificing privacy or performance.
          </p>
          <p>
            For any privacy-related inquiries, contact us at:{' '}
            <a href="mailto:contact@logforge.dev" className="text-emerald-400 hover:underline">contact@logforge.dev</a>
          </p>
        </Section>

        <Section title="2. Data We Collect on This Website">
          <p>When you visit <strong className="text-zinc-300">logforge.dev</strong>, we may collect:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li><strong className="text-zinc-300">Contact form data</strong> — your name, email address, and message when you reach out to us.</li>
            <li><strong className="text-zinc-300">Anonymous analytics</strong> — page views, referrer, and session duration. No personally identifiable information (PII) is stored. We use privacy-respecting tooling only.</li>
            <li><strong className="text-zinc-300">Cookies</strong> — limited to functional and analytical cookies.</li>
          </ul>
          <p>We do <strong className="text-zinc-300">not</strong> sell, rent, or share your personal data with third parties for marketing purposes.</p>
        </Section>

        <Section title="3. Data in Self-Hosted Deployments">
          <p>
            When you self-host LogForge, all data — including application logs, user accounts, and metadata — is stored exclusively on your own infrastructure. LogForge Inc. has no access to this data at any point.
          </p>
          <p>
            You are the sole data controller for your deployment. You are responsible for complying with applicable data protection laws (GDPR, CCPA, etc.) within your own environment.
          </p>
        </Section>

        <Section title="4. How We Use Your Data">
          <p>We use data collected through this website solely to:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Respond to inquiries and support requests</li>
            <li>Improve the website and documentation</li>
            <li>Send product updates if you have opted in</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>
            Contact form submissions are retained for up to 12 months, after which they are deleted unless an ongoing relationship requires otherwise. Analytics data is aggregated and anonymized — individual sessions are not retained beyond 30 days.
          </p>
        </Section>

        <Section title="6. Third-Party Services">
          <p>
            This website may use the following third-party services, each with their own privacy policies:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li><strong className="text-zinc-300">GitHub</strong> — source code hosting and issue tracking</li>
            <li><strong className="text-zinc-300">npm / PyPI</strong> — SDK distribution</li>
          </ul>
          <p>We do not integrate advertising networks, social media trackers, or behavioral profiling tools.</p>
        </Section>

        <Section title="7. Your Rights">
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction or deletion of your data</li>
            <li>Object to or restrict processing</li>
            <li>Data portability</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{' '}
            <a href="mailto:contact@logforge.dev" className="text-emerald-400 hover:underline">contact@logforge.dev</a>.
            We will respond within 30 days.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We apply industry-standard security measures to protect data collected on this website, including HTTPS encryption, access controls, and regular security reviews. No method of transmission over the Internet is 100% secure; we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            LogForge is intended for professional use by developers and engineering teams. We do not knowingly collect personal data from individuals under the age of 16.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. The "Last updated" date at the top of this page will reflect any changes. Continued use of the website after changes constitutes acceptance of the updated policy.
          </p>
        </Section>

        {/* Footer nav */}
        <div className="border-t border-white/5 pt-10 flex flex-wrap gap-6 text-sm text-zinc-500">
          <Link to="/terms-of-service" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
          <a href="mailto:contact@logforge.dev" className="hover:text-emerald-400 transition-colors">contact@logforge.dev</a>
        </div>
      </div>
    </div>
  );
}

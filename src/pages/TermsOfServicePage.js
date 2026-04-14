import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
  <section className="mb-12">
    <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
    <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">{children}</div>
  </section>
);

export default function TermsOfServicePage() {
  return (
    <div className="pt-16 pb-24 bg-zinc-950 min-h-screen">
      <div className="mx-auto px-6 max-w-3xl">

        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-8">
            <FileText className="w-4 h-4" /> Legal
          </div>
          <h1 className="text-5xl font-black text-white mb-6 tracking-tighter">
            Terms of <span className="text-emerald-500 italic">Service</span>
          </h1>
          <p className="text-zinc-500 text-sm">
            Last updated: <span className="text-zinc-300">April 14, 2026</span>
          </p>
        </div>

        {/* Intro */}
        <div className="p-6 rounded-2xl border border-zinc-700/50 bg-zinc-900/50 mb-12">
          <p className="text-zinc-300 text-sm leading-relaxed">
            By accessing this website or using the LogForge software, you agree to be bound by these Terms of Service. Please read them carefully. If you do not agree, do not use LogForge.
          </p>
        </div>

        <Section title="1. Definitions">
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li><strong className="text-zinc-300">"LogForge"</strong> refers to the software platform, its source code, SDKs, documentation, and associated services provided by LogForge Inc.</li>
            <li><strong className="text-zinc-300">"You" / "User"</strong> refers to any individual or organization accessing or using LogForge.</li>
            <li><strong className="text-zinc-300">"Self-hosted instance"</strong> refers to a deployment of LogForge on infrastructure owned or controlled by the User.</li>
          </ul>
        </Section>

        <Section title="2. License and Permitted Use">
          <p>
            The LogForge core platform is released under the <strong className="text-zinc-300">MIT License</strong>. You are free to use, copy, modify, and distribute it in accordance with the license terms.
          </p>
          <p>
            Commercial add-ons, enterprise features, and hosted services are governed by separate commercial license agreements where applicable.
          </p>
          <p>You may use LogForge to:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Monitor your own applications and infrastructure</li>
            <li>Integrate with your existing DevOps tooling</li>
            <li>Build internal developer tooling on top of the SDK</li>
          </ul>
        </Section>

        <Section title="3. Prohibited Uses">
          <p>You agree not to use LogForge to:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Collect, process, or store data in violation of applicable laws or third-party rights</li>
            <li>Conduct unauthorized access, penetration testing, or attacks against third-party systems</li>
            <li>Resell or sublicense access to a hosted version of LogForge without a written agreement from us</li>
            <li>Remove or obscure copyright, trademark, or attribution notices</li>
            <li>Use LogForge in any application that violates human rights, facilitates illegal surveillance, or supports illegal activities</li>
          </ul>
        </Section>

        <Section title="4. Self-Hosted Deployments">
          <p>
            When you self-host LogForge, you are solely responsible for:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Securing your infrastructure and access credentials</li>
            <li>Compliance with data protection laws applicable in your jurisdiction</li>
            <li>Keeping your deployment up to date with security patches</li>
            <li>Properly managing user accounts, roles, and permissions within your instance</li>
          </ul>
          <p>
            LogForge Inc. has no access to, and no liability for, data stored in your self-hosted deployment.
          </p>
        </Section>

        <Section title="5. SDKs and Third-Party Integrations">
          <p>
            The LogForge JavaScript SDK (<code className="text-emerald-400 bg-zinc-900 px-1 rounded">@loickadj/logforge-js</code>) and Python SDK (<code className="text-emerald-400 bg-zinc-900 px-1 rounded">logforge-py</code>) are provided under the MIT License. You may use them freely in open-source and commercial projects.
          </p>
          <p>
            Third-party services integrated with LogForge (Elasticsearch, Docker, GELF shippers, etc.) are subject to their own terms of service and licenses.
          </p>
        </Section>

        <Section title="6. Intellectual Property">
          <p>
            The LogForge name, logo, and brand assets are the property of LogForge Inc. You may not use our trademarks, logos, or brand in any way that implies endorsement or affiliation without prior written permission.
          </p>
          <p>
            Contributions to the open-source codebase are welcomed under the project's contribution guidelines. By submitting a pull request, you grant LogForge Inc. a perpetual, royalty-free license to include your contribution in the project.
          </p>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <p>
            LogForge is provided <strong className="text-zinc-300">"AS IS"</strong> without warranty of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p>
            We do not guarantee that the software will be error-free, secure, or uninterrupted. Use of LogForge is at your own risk.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, LogForge Inc. and its contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of — or inability to use — the software, even if advised of the possibility of such damages.
          </p>
          <p>
            Our total liability in connection with these Terms shall not exceed the amount you paid us (if any) in the 12 months preceding the claim.
          </p>
        </Section>

        <Section title="9. Modifications to the Service">
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the LogForge website, documentation, or hosted services at any time with reasonable notice. Changes to the open-source software follow standard open-source release processes.
          </p>
        </Section>

        <Section title="10. Governing Law">
          <p>
            These Terms are governed by and construed in accordance with the laws of the jurisdiction in which LogForge Inc. is incorporated, without regard to its conflict of law provisions.
          </p>
          <p>
            Any disputes arising under these Terms shall be submitted to binding arbitration or the competent courts of that jurisdiction.
          </p>
        </Section>

        <Section title="11. Changes to These Terms">
          <p>
            We may update these Terms from time to time. The "Last updated" date at the top of this page will reflect changes. Continued use of the website or software after updates constitutes acceptance of the revised Terms.
          </p>
          <p>
            For material changes, we will make reasonable efforts to notify users via the website or email.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about these Terms? Reach us at:{' '}
            <a href="mailto:contact@logforge.dev" className="text-emerald-400 hover:underline">contact@logforge.dev</a>
          </p>
        </Section>

        {/* Footer nav */}
        <div className="border-t border-white/5 pt-10 flex flex-wrap gap-6 text-sm text-zinc-500">
          <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
          <a href="mailto:contact@logforge.dev" className="hover:text-emerald-400 transition-colors">contact@logforge.dev</a>
        </div>
      </div>
    </div>
  );
}

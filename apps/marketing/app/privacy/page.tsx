import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="px-6 py-24 sm:py-32">
      <article className="prose prose-invert mx-auto max-w-3xl prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Effective Date: March 29, 2026
        </p>
        <p className="text-sm text-muted-foreground">
          <em>
            This document is a template and should be reviewed by legal counsel
            before use in production.
          </em>
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          SupportAI, Inc. (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot;
          or &quot;our&quot;) collects information to provide and improve our
          AI-powered customer support platform. We collect the following
          categories of information:
        </p>
        <h3>Information You Provide</h3>
        <ul>
          <li>
            <strong>Account information</strong>: name, email address,
            organization name, and billing details when you create an account.
          </li>
          <li>
            <strong>Knowledge base content</strong>: documents, URLs, and text
            you upload to train your AI agent.
          </li>
          <li>
            <strong>Support conversations</strong>: messages exchanged between
            your customers and the AI agent or human support team through the
            widget.
          </li>
          <li>
            <strong>Settings and configuration</strong>: widget customization,
            channel configurations, team member details, and escalation rules.
          </li>
        </ul>
        <h3>Information Collected Automatically</h3>
        <ul>
          <li>
            <strong>Usage data</strong>: pages visited, features used, session
            duration, and interaction patterns within the dashboard.
          </li>
          <li>
            <strong>Device and browser data</strong>: IP address, browser type,
            operating system, and device identifiers.
          </li>
          <li>
            <strong>Performance data</strong>: AI resolution rates, response
            times, and error logs for service reliability.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service.</li>
          <li>
            Process your knowledge base content through our RAG (Retrieval
            Augmented Generation) pipeline to power AI responses.
          </li>
          <li>
            Generate AI-powered responses to your customers&apos; support
            inquiries.
          </li>
          <li>
            Provide analytics and insights about your support operations.
          </li>
          <li>Process payments and manage your subscription.</li>
          <li>
            Send transactional communications (account confirmations, billing
            receipts, security alerts).
          </li>
          <li>Detect and prevent fraud, abuse, and security incidents.</li>
          <li>
            Comply with legal obligations and enforce our Terms of Service.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> use your knowledge base content or customer
          conversations to train our general AI models. Your data is used solely
          to power your organization&apos;s AI agent.
        </p>

        <h2>3. Data Sharing</h2>
        <p>
          We do not sell your personal information. We may share information with
          the following categories of recipients:
        </p>
        <ul>
          <li>
            <strong>AI model providers</strong>: We send conversation context
            and knowledge base excerpts to third-party AI providers (e.g.,
            Anthropic, OpenAI) to generate responses. These providers process
            data under strict data processing agreements and do not retain your
            data for model training.
          </li>
          <li>
            <strong>Infrastructure providers</strong>: We use cloud
            infrastructure providers (Vercel, Neon, Upstash) to host and operate
            the Service. These providers process data on our behalf under data
            processing agreements.
          </li>
          <li>
            <strong>Payment processors</strong>: Stripe processes payment
            information on our behalf. We do not store credit card numbers on our
            servers.
          </li>
          <li>
            <strong>Communication providers</strong>: Twilio and Resend process
            messages and emails on our behalf for multi-channel support
            delivery.
          </li>
          <li>
            <strong>Legal requirements</strong>: We may disclose information if
            required by law, court order, or governmental regulation.
          </li>
        </ul>

        <h2>4. Data Retention</h2>
        <p>We retain your data as follows:</p>
        <ul>
          <li>
            <strong>Account data</strong>: Retained for the duration of your
            account plus 30 days after deletion.
          </li>
          <li>
            <strong>Knowledge base content</strong>: Retained until you delete
            it or your account is terminated. Embeddings (vector
            representations) are deleted alongside the source content.
          </li>
          <li>
            <strong>Conversation data</strong>: Retained for 24 months from the
            conversation date, then automatically anonymized.
          </li>
          <li>
            <strong>Usage and analytics data</strong>: Retained in aggregated,
            anonymized form indefinitely for service improvement.
          </li>
          <li>
            <strong>Billing records</strong>: Retained for 7 years as required
            by financial regulations.
          </li>
        </ul>

        <h2>5. Security</h2>
        <p>
          We implement industry-standard security measures to protect your data:
        </p>
        <ul>
          <li>Encryption in transit (TLS 1.3) and at rest (AES-256).</li>
          <li>
            Multi-tenant data isolation with row-level security enforced at the
            database level.
          </li>
          <li>
            Regular security audits and automated vulnerability scanning.
          </li>
          <li>
            Access controls with role-based permissions and audit logging.
          </li>
          <li>SOC 2 Type II compliance (in progress).</li>
        </ul>
        <p>
          No method of electronic transmission or storage is 100% secure. While
          we strive to protect your data, we cannot guarantee absolute security.
        </p>

        <h2>6. Your Rights Under GDPR</h2>
        <p>
          If you are located in the European Economic Area (EEA), United
          Kingdom, or Switzerland, you have the following rights under the
          General Data Protection Regulation (GDPR):
        </p>
        <ul>
          <li>
            <strong>Right of access</strong>: Request a copy of the personal
            data we hold about you.
          </li>
          <li>
            <strong>Right to rectification</strong>: Request correction of
            inaccurate or incomplete data.
          </li>
          <li>
            <strong>Right to erasure</strong>: Request deletion of your personal
            data, subject to legal retention requirements.
          </li>
          <li>
            <strong>Right to restrict processing</strong>: Request that we limit
            how we use your data.
          </li>
          <li>
            <strong>Right to data portability</strong>: Receive your data in a
            structured, machine-readable format.
          </li>
          <li>
            <strong>Right to object</strong>: Object to processing based on
            legitimate interests.
          </li>
          <li>
            <strong>Right to withdraw consent</strong>: Where processing is
            based on consent, withdraw it at any time.
          </li>
        </ul>
        <p>
          Our legal basis for processing personal data includes: performance of
          a contract (providing the Service), legitimate interests (improving the
          Service, security), and compliance with legal obligations. To exercise
          your rights, contact us at privacy@supportai.dev.
        </p>

        <h2>7. Your Rights Under CCPA</h2>
        <p>
          If you are a California resident, the California Consumer Privacy Act
          (CCPA) provides you with the following rights:
        </p>
        <ul>
          <li>
            <strong>Right to know</strong>: Request disclosure of the categories
            and specific pieces of personal information we have collected about
            you.
          </li>
          <li>
            <strong>Right to delete</strong>: Request deletion of your personal
            information, subject to certain exceptions.
          </li>
          <li>
            <strong>Right to opt-out of sale</strong>: We do not sell personal
            information. No opt-out is necessary.
          </li>
          <li>
            <strong>Right to non-discrimination</strong>: We will not
            discriminate against you for exercising your CCPA rights.
          </li>
        </ul>
        <p>
          To exercise your CCPA rights, contact us at privacy@supportai.dev or
          use the data management tools in your account settings.
        </p>

        <h2>8. Cookies and Tracking</h2>
        <p>We use the following types of cookies and similar technologies:</p>
        <ul>
          <li>
            <strong>Essential cookies</strong>: Required for authentication,
            security, and core functionality. These cannot be disabled.
          </li>
          <li>
            <strong>Analytics cookies</strong>: Help us understand how the
            Service is used (e.g., Vercel Analytics). These are anonymized and
            do not track individual users across sites.
          </li>
          <li>
            <strong>Preference cookies</strong>: Store your settings and
            preferences (e.g., theme, language).
          </li>
        </ul>
        <p>
          We do not use advertising cookies or cross-site tracking. You can
          manage cookie preferences through your browser settings.
        </p>

        <h2>9. International Data Transfers</h2>
        <p>
          Your data may be processed in the United States and other countries
          where our infrastructure providers operate. When we transfer data
          outside the EEA, we ensure appropriate safeguards are in place,
          including Standard Contractual Clauses approved by the European
          Commission.
        </p>

        <h2>10. Children&apos;s Privacy</h2>
        <p>
          The Service is not directed at individuals under 16 years of age. We
          do not knowingly collect personal information from children. If we
          become aware that we have collected data from a child, we will take
          steps to delete it promptly.
        </p>

        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of material changes by posting the updated policy on this page and
          updating the effective date. For significant changes, we will also
          notify you via email.
        </p>

        <h2>12. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or wish to exercise
          your data rights, contact us at:
        </p>
        <ul>
          <li>
            <strong>Email</strong>: privacy@supportai.dev
          </li>
          <li>
            <strong>Data Protection Officer</strong>: dpo@supportai.dev
          </li>
          <li>
            <strong>Address</strong>: SupportAI, Inc., 123 Innovation Drive,
            Suite 400, Wilmington, DE 19801
          </li>
        </ul>
      </article>
    </div>
  );
}

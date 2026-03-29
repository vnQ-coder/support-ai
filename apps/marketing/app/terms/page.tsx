import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="px-6 py-24 sm:py-32">
      <article className="prose prose-invert mx-auto max-w-3xl prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground">
        <h1>Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Effective Date: March 29, 2026
        </p>
        <p className="text-sm text-muted-foreground">
          <em>
            This document is a template and should be reviewed by legal counsel
            before use in production.
          </em>
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the SupportAI platform (&quot;Service&quot;),
          operated by SupportAI, Inc. (&quot;Company,&quot; &quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these
          Terms of Service (&quot;Terms&quot;). If you do not agree to these
          Terms, you may not access or use the Service.
        </p>
        <p>
          These Terms apply to all visitors, users, and others who access or use
          the Service, including organizations and their authorized
          representatives.
        </p>

        <h2>2. Description of Services</h2>
        <p>
          SupportAI provides an AI-powered customer support platform that
          includes automated ticket resolution, knowledge base management,
          multi-channel messaging, human handoff capabilities, analytics, and
          related tools. The Service is provided on a subscription basis as
          described on our pricing page.
        </p>

        <h2>3. User Accounts</h2>
        <p>
          To use the Service, you must create an account and provide accurate,
          complete, and current information. You are responsible for safeguarding
          your account credentials and for all activity that occurs under your
          account.
        </p>
        <p>
          You must notify us immediately of any unauthorized use of your account.
          We are not liable for any loss arising from unauthorized use of your
          account.
        </p>
        <p>
          Organization administrators are responsible for managing user access
          within their organization and ensuring all users comply with these
          Terms.
        </p>

        <h2>4. Payment Terms</h2>
        <p>
          Paid plans are billed in advance on a monthly basis. All fees are
          non-refundable except as required by law or as expressly stated in
          these Terms.
        </p>
        <ul>
          <li>
            <strong>Flat-rate pricing</strong>: Subscription fees are fixed
            monthly amounts based on the selected plan tier. There are no
            per-resolution or per-seat charges.
          </li>
          <li>
            <strong>Free trial</strong>: We may offer a free trial period. At
            the end of the trial, your account will be billed unless you cancel
            before the trial ends.
          </li>
          <li>
            <strong>Price changes</strong>: We may change our prices with at
            least 30 days&apos; written notice. Price changes take effect at the
            start of the next billing cycle.
          </li>
          <li>
            <strong>Failed payments</strong>: If payment fails, we may suspend
            access to the Service until payment is received.
          </li>
        </ul>

        <h2>5. Prohibited Uses</h2>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Violate any applicable laws, regulations, or third-party rights.</li>
          <li>
            Transmit malware, viruses, or other harmful code through the
            platform.
          </li>
          <li>
            Attempt to gain unauthorized access to our systems, other
            users&apos; accounts, or data.
          </li>
          <li>
            Use the AI features to generate content that is misleading,
            fraudulent, defamatory, or harmful.
          </li>
          <li>
            Reverse engineer, decompile, or disassemble any part of the Service.
          </li>
          <li>
            Resell, sublicense, or redistribute the Service without our prior
            written consent.
          </li>
          <li>
            Use the Service in a manner that could damage, disable, or impair
            our infrastructure.
          </li>
        </ul>

        <h2>6. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are
          and will remain the exclusive property of SupportAI, Inc. and its
          licensors. The Service is protected by copyright, trademark, and other
          applicable laws.
        </p>
        <p>
          You retain ownership of all data and content you submit to the Service
          (&quot;Your Content&quot;). By submitting Your Content, you grant us a
          limited, non-exclusive license to use, process, and store Your Content
          solely for the purpose of providing and improving the Service.
        </p>
        <p>
          AI-generated responses produced by the Service on behalf of your
          organization are considered part of the Service output. You may use
          these responses in your customer communications without restriction.
        </p>

        <h2>7. Disclaimers</h2>
        <p>
          The Service is provided on an &quot;AS IS&quot; and &quot;AS
          AVAILABLE&quot; basis without warranties of any kind, whether express
          or implied, including but not limited to implied warranties of
          merchantability, fitness for a particular purpose, and
          non-infringement.
        </p>
        <p>
          We do not guarantee that AI-generated responses will be accurate,
          complete, or appropriate for every situation. You are responsible for
          reviewing AI outputs and configuring escalation rules appropriate for
          your use case.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, SupportAI, Inc. shall not be
          liable for any indirect, incidental, special, consequential, or
          punitive damages, including but not limited to loss of profits, data,
          use, goodwill, or other intangible losses, resulting from:
        </p>
        <ul>
          <li>Your access to or use of (or inability to access or use) the Service.</li>
          <li>Any conduct or content of any third party on the Service.</li>
          <li>AI-generated responses that are inaccurate or inappropriate.</li>
          <li>Unauthorized access, use, or alteration of your data.</li>
        </ul>
        <p>
          In no event shall our total liability exceed the amount you paid us in
          the twelve (12) months preceding the claim.
        </p>

        <h2>9. Termination</h2>
        <p>
          You may cancel your subscription at any time through your account
          settings. Cancellation takes effect at the end of the current billing
          period.
        </p>
        <p>
          We may terminate or suspend your access immediately, without prior
          notice, for conduct that we determine, in our sole discretion,
          violates these Terms or is harmful to other users, us, or third
          parties, or for any other reason.
        </p>
        <p>
          Upon termination, your right to use the Service will cease immediately.
          We will make your data available for export for 30 days following
          termination, after which it may be permanently deleted.
        </p>

        <h2>10. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of the State of Delaware, United States, without regard to its
          conflict of law provisions.
        </p>
        <p>
          Any disputes arising from these Terms or the Service shall be resolved
          through binding arbitration in accordance with the rules of the
          American Arbitration Association, except that either party may seek
          injunctive relief in any court of competent jurisdiction.
        </p>

        <h2>11. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will
          provide notice of material changes by posting the updated Terms on
          this page and updating the effective date. Your continued use of the
          Service after such changes constitutes acceptance of the new Terms.
        </p>

        <h2>12. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <ul>
          <li>
            <strong>Email</strong>: legal@supportai.dev
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

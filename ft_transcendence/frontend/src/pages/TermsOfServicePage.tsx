export default function TermsOfServicePage() {
  return (
  <div className="px-4 py-2 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="px-2 py-1 border">
      <h1 className="w-fit mx-auto border-2 px-2 py-1 font-extrabold border-yellow-400 hover:bg-yellow-400">Terms of Service</h1>
      <p className="mt-2"><b>Last updated:</b> 2026-01-21</p>

      <p>
        These Terms of Service (“Terms”) govern your use of <b>ft_transcendence</b>.
        By using the application, you agree to these Terms.
      </p>

      <h2 className="mt-2"><b>1. Eligibility</b></h2>
      <p>
        You must be able to use this service legally in your location. Accounts may be limited
        to authorized users depending on the deployment environment.
      </p>

      <h2 className="mt-2"><b>2. Accounts and security</b></h2>
      <ul>
        <li>You are responsible for maintaining the confidentiality of your credentials.</li>
        <li>You agree not to attempt to access other users’ accounts or data.</li>
        <li>We may suspend accounts involved in abuse, cheating, or security threats.</li>
      </ul>

      <h2 className="mt-2"><b>3. Acceptable use</b></h2>
      <ul>
        <li>No cheating, exploiting, or intentionally breaking gameplay/network systems.</li>
        <li>No harassment, abusive behavior, or attempts to disrupt the service.</li>
        <li>No automated scraping or excessive requests (rate limits apply).</li>
      </ul>

      <h2 className="mt-2"><b>4. User content</b></h2>
      <p>
        If you upload an avatar, you confirm you have the rights to use it and it does not violate laws
        or third-party rights. We may remove content that is inappropriate or unlawful.
      </p>

      <h2 className="mt-2"><b>5. Service availability</b></h2>
      <p>
        The service is provided on an “as-is” basis for educational/project purposes.
        We do not guarantee uninterrupted availability.
      </p>

      <h2 className="mt-2"><b>6. Privacy</b></h2>
      <p>
        Your use of the service is also governed by our Privacy Policy.
      </p>

      <h2 className="mt-2"><b>7. Limitation of liability</b></h2>
      <p>
        To the maximum extent permitted by law, we are not liable for indirect or consequential damages
        arising from your use of the service.
      </p>

      <h2 className="mt-2"><b>8. Changes</b></h2>
      <p>
        We may update these Terms as the project evolves. Continued use means you accept the updated Terms.
      </p>

      <h2 className="mt-2"><b>9. Contact</b></h2>
      <p>
        For questions, contact the project administrator (as provided in the application or repository).
      </p>
    </div>
  </div>
  );
}

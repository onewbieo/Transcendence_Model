export default function PrivacyPolicyPage() {
  return (
  <div className="px-4 py-2 w-full max-h-[calc(95dvh-6rem)] overflow-y-auto">
    <div className="border px-2 py-1">
      <h1 className="w-fit mx-auto border-2 border-yellow-400 px-2 py-1 text-center font-extrabold hover:bg-yellow-400">Privacy Policy</h1>
      <p className="mt-2"><b>Last updated:</b> 2026-01-21</p>

      <p>
        This Privacy Policy explains how <b>ft_transcendence</b> (“we”, “our”, “us”) collects,
        uses, and protects your information when you use our application.
      </p>

      <h2 className="mt-2"><b>1. Information we collect</b></h2>
      <ul>
        <li><b>Account info:</b> email, display name, password hash (stored securely).</li>
        <li><b>Authentication data:</b> login sessions/tokens; if enabled, 2FA status.</li>
        <li><b>Game data:</b> match history, scores, opponents, timestamps, leaderboard stats.</li>
        <li><b>Uploads:</b> avatar image you choose to upload.</li>
        <li><b>Technical data:</b> basic logs (e.g. IP address, request metadata) for security and debugging.</li>
      </ul>

      <h2 className="mt-2"><b>2. How we use your information</b></h2>
      <ul>
        <li>Provide and operate the service (login, gameplay, matchmaking, leaderboards).</li>
        <li>Maintain account security, prevent abuse, enforce rate limits.</li>
        <li>Improve reliability and fix bugs (diagnostics and logs).</li>
        <li>Show your profile info (e.g., name/avatar) to other users where relevant in the app.</li>
      </ul>

      <h2 className="mt-2"><b>3. Legal basis</b></h2>
      <p>
        We process data to provide the service you request, to comply with security needs,
        and where applicable, with your consent (e.g., uploading an avatar, enabling 2FA).
      </p>

      <h2 className="mt-2"><b>4. Sharing of information</b></h2>
      <p>
        We do not sell your personal data. We may share minimal data only when necessary to:
      </p>
      <ul>
        <li>Operate infrastructure (hosting, database) as part of running the service.</li>
        <li>Comply with legal obligations if required.</li>
      </ul>

      <h2 className="mt-2"><b>5. Data retention</b></h2>
      <p>
        We keep your account and game data while your account remains active.
        You may request deletion where feasible (subject to project constraints and legal requirements).
      </p>

      <h2 className="mt-2"><b>6. Security</b></h2>
      <p>
        We use industry-standard security practices such as password hashing, token-based authentication,
        and HTTPS where available. No system is 100% secure, but we take reasonable measures to protect data.
      </p>

      <h2 className="mt-2"><b>7. Your rights</b></h2>
      <ul>
        <li>Access and update certain profile information in the app.</li>
        <li>Request account deletion (if supported in the project deployment).</li>
      </ul>

      <h2 className="mt-2"><b>8. Contact</b></h2>
      <p>
        If you have questions, contact the project administrator (as provided in the application or repository).
      </p>
    </div>
  </div>
  );
}


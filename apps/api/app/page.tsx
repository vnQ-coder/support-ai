export default function ApiHomePage() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>SupportAI API</h1>
      <p>API server is running. Available endpoints:</p>
      <ul>
        <li><code>GET /api/health</code> — Health check</li>
        <li><code>POST /api/v1/chat</code> — Chat endpoint (coming soon)</li>
        <li><code>POST /api/v1/webhooks</code> — Webhook receiver (coming soon)</li>
      </ul>
    </main>
  );
}

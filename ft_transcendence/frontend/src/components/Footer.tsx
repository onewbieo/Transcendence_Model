import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={{ padding: 12, borderTop: "1px solid #ddd", marginTop: 24, textAlign: "center" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms of Service</Link>
      </div>
    </footer>
  );
}


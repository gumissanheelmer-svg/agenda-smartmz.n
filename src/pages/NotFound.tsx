import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Generic 404 page — intentionally reveals nothing about internal route structure.
 * Silently logs suspicious path access attempts to security_events.
 */

// Patterns that indicate automated scanning or attack probing
const SUSPICIOUS_PATTERNS = [
  /\.(php|asp|aspx|jsp|cgi|env|git|svn|htaccess|htpasswd)/i,
  /\/(wp-admin|wp-login|wp-content|wp-includes|wordpress)/i,
  /\/(admin\.php|login\.php|config\.php|setup\.php|install\.php)/i,
  /\/(\.env|\.git|\.svn|\.DS_Store|\.aws|\.ssh)/i,
  /\/(phpmyadmin|pma|myadmin|mysql|pgadmin|adminer)/i,
  /\/(api\/v[0-9]|graphql|__debug|_profiler|actuator)/i,
  /\/(etc\/passwd|proc\/self|boot\.ini|win\.ini)/i,
  /\/(shell|cmd|command|exec|eval|system)\b/i,
  /\/(\.well-known\/)/i,
  /[<>"'`]/, // XSS probe characters in path
  /%[0-9a-f]{2}.*%[0-9a-f]{2}/i, // heavy URL encoding (fuzzing)
  /\/(node_modules|vendor|composer|package\.json|yarn\.lock)/i,
  /\/(robots\.txt|sitemap\.xml|xmlrpc\.php)/i,
  /\/(backup|dump|export|database|db\.sql)/i,
];

function isSuspiciousPath(path: string): boolean {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(path));
}

function logSilently(path: string, suspicious: boolean): void {
  try {
    supabase.functions
      .invoke("log-security-event", {
        body: {
          event_type: suspicious ? "attack_probe" : "not_found",
          metadata: {
            path: path.slice(0, 200), // truncate to prevent log injection
            suspicious,
            timestamp: new Date().toISOString(),
            source: "404_handler",
          },
        },
      })
      .catch(() => {});
  } catch {
    // fail silently
  }
}

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const path = window.location.pathname;
    const suspicious = isSuspiciousPath(path);
    logSilently(path, suspicious);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-6">
        <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          A página que procura não existe.
        </p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
};

export default NotFound;

// Usado pelo QA: executa o passo de segurança do vínculo Google para um e-mail.
import { secureGoogleLink } from "../../lib/google-link";

secureGoogleLink(process.argv[2]).then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);

type Translate = (portuguese: string, english: string) => string;

export function googleAuthErrorMessage(code: string, tr: Translate): string {
  switch (code) {
    case "AccessDenied":
      return tr(
        "O Google não confirmou este e-mail. Tente outra conta.",
        "Google did not confirm this email. Try another account."
      );
    case "OAuthAccountNotLinked":
      return tr(
        "Este e-mail já está em outra conta. Entre com a senha e vincule o Google depois.",
        "This email already belongs to another account. Sign in with your password first."
      );
    case "Configuration":
      return tr(
        "Login com Google ainda não está configurado.",
        "Google sign-in is not configured yet."
      );
    default:
      return tr(
        "Não foi possível entrar com o Google. Tente novamente.",
        "Unable to continue with Google. Please try again."
      );
  }
}

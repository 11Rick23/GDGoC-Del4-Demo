export class SessionState {
  name: string | null = null;
  answers: Record<string, string[]> = {};
  attempts: Record<string, number> = {};
  profile_txt: string | null = null;
  step: string = "join";
}

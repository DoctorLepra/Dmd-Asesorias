export interface PasswordValidationState {
  length: boolean;
  uppercase: boolean;
  special: boolean;
  score: number;
  isValid: boolean;
}

const hasUppercase = (str: string) => /[A-Z]/.test(str);
const hasSpecial = (str: string) => /[()/=*#]/.test(str);

export const getPasswordValidationState = (password: string): PasswordValidationState => {
  const length = password.length >= 8;
  const uppercase = hasUppercase(password);
  const special = hasSpecial(password);

  let score = 0;
  if (length) score++;
  if (uppercase) score++;
  if (special) score++;
  
  // A simple bonus for length beyond the minimum for a better visual feedback
  if (password.length >= 12) score++;

  const isValid = length && uppercase && special;

  return { length, uppercase, special, score, isValid };
};

export interface ILogin {
  email: string;
  password: string;
}

export interface IRegister extends ILogin {
  firstName: string;
  lastName: string;
}

export interface IVerifyEmail {
  email: string;
  code: string;
}

export enum VerificationCodePurpose {
  CONFIRM_EMAIL = 'confirm_email',
  RESET_PASSWORD = 'reset_password',
}

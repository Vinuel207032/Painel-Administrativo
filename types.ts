
export interface UserSession {
  id: string | number;
  nome: string;
  email: string;
  role: string;
}

export enum LoginStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

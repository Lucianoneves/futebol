declare namespace Express {
  export interface Request {
    user: {
      user_id: string;
      role: "ADMIN" | "USER" | "PLAYER";
    };
  }
}

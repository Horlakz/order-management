export interface IBaseResponse<T> {
  status: number;
  message: string;
  data?: T;
}

// export type PrismaClientTx = Omit<
//   PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
//   '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
// >;

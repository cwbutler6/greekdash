declare module '@prisma/nextjs-monorepo-workaround-plugin' {
  import { Compiler } from 'webpack';
  
  interface PrismaPluginOptions {
    /** Optional configuration for the plugin */
    [key: string]: unknown;
  }
  
  export class PrismaPlugin {
    constructor(options?: PrismaPluginOptions);
    apply(compiler: Compiler): void;
  }
  
  export default PrismaPlugin;
}
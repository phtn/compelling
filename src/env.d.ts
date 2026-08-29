interface ImportMetaEnv {
  readonly [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "*.btsx" {
  import type { ComponentBody } from "octane";

  const component: ComponentBody;
  export default component;
}

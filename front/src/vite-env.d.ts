/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_OVH_AI_ENDPOINT_URL: string;
    readonly VITE_OVH_AI_ACCESS_TOKEN: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

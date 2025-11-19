/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_OVH_AI_ENDPOINT_URL: string;
    readonly VITE_OVH_AI_ACCESS_TOKEN: string;
    readonly VITE_CALL_API_ENDPOINT: string;
    readonly VITE_BACKEND_URL: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

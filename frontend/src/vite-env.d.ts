/// <reference types="vite/client" />

/**
 * Vite environment variable type definitions.
 * 
 * Vite automatically exposes environment variables prefixed with VITE_*
 * through import.meta.env. This file provides TypeScript type definitions
 * for our custom environment variables.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_CLIENT_ID: string;
  readonly VITE_AWS_REGION: string;
  readonly VITE_S3_BUCKET_NAME: string;
  readonly VITE_LOCAL_AUTH_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Type declaration for process module alias.
 * Vite aliases 'process' to 'process/browser' in vite.config.ts
 */
declare module 'process' {
  import process from 'process/browser'
  export = process
}


//seaweedfs config type declaration
export type StorageConfig = {
  endpoint: string;
  region: string;
  forcePathStyle: boolean;
  useDualstackEndpoint: boolean;
  targetDir: string;
  responseChecksumValidation: string;
  requestChecksumCalculation: string;
  credentialsAcessKeyID: string;
  credentialSecretAcessKey: string;
};

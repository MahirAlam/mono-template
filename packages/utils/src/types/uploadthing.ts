export interface UploadFileResponse {
  data: UploadData;
  error: null;
}

export interface UploadData {
  key: string;
  url: string;
  name: string;
  size: number;
  ufsUrl: string | undefined;
}

export interface task {
  Package: string;
  Author: string;
  CreateTime: Date;
  Reviewer?: string;
  ReviewTime?: Date;
  Type: string;
  Status: string;
  Content?: {
    set?: {
      [s: string]: any;
    };
    unset?: string[];
  };
}

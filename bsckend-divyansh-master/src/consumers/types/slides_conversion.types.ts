export interface SlidesConversionMessage {
  organization_id: string;
  project_id: string;
  slides_id: string;
  s3_source_url: string;
  s3_key: string;
  original_filename: string;
  knowledge_base_content?: string;
}

export interface SlidesConversionSqsPayload {
  data: SlidesConversionMessage;
}

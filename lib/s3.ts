
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

const s3Client = createS3Client();

export async function uploadFile(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
  const { bucketName, folderPrefix } = getBucketConfig();
  const key = `${folderPrefix}${fileName}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  
  return key;
}

export async function downloadFile(key: string): Promise<string> {
  const { bucketName } = getBucketConfig();
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return signedUrl;
}

export async function deleteFile(key: string): Promise<void> {
  const { bucketName } = getBucketConfig();
  
  await s3Client.send(new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  }));
}

export async function renameFile(oldKey: string, newKey: string): Promise<void> {
  // S3 doesn't support renaming, so we need to copy and delete
  // For now, we'll just keep using the old key
  // If needed, implement copy operation here
}

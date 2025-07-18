import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import config from '../config/env.js';
import logger from './logger.js';
import { ApiError } from './apiError.js';
import FileUtils from './fileUtils.js';

/**
 * Storage service for handling file uploads to cloud storage
 */
class StorageService {
  constructor() {
    this.s3Client = null;
    this.bucketName = config.STORAGE_BUCKET_NAME;
    this.region = config.STORAGE_REGION || 'us-east-1';
    this.endpoint = config.STORAGE_ENDPOINT;
    this.forcePathStyle = config.STORAGE_FORCE_PATH_STYLE === 'true';
    this.signedUrlExpiry = parseInt(config.STORAGE_SIGNED_URL_EXPIRY || '3600', 10); // 1 hour

    this.initialize();
  }

  /**
   * Initialize the storage client
   */
  initialize() {
    try {
      const s3Config = {
        region: this.region,
        credentials: {
          accessKeyId: config.STORAGE_ACCESS_KEY_ID,
          secretAccessKey: config.STORAGE_SECRET_ACCESS_KEY
        },
        forcePathStyle: this.forcePathStyle
      };

      // Add custom endpoint if provided (for S3-compatible services)
      if (this.endpoint) {
        s3Config.endpoint = this.endpoint;
      }

      this.s3Client = new S3Client(s3Config);
      logger.info('Storage service initialized');
    } catch (error) {
      logger.error('Failed to initialize storage service:', error);
      throw new ApiError(500, 'Failed to initialize storage service');
    }
  }

  /**
   * Upload a file to storage
   * @param {Buffer|Readable|string} file - File content as Buffer, Readable stream, or file path
   * @param {string} key - Object key (path) in the bucket
   * @param {Object} [options] - Upload options
   * @param {string} [options.contentType] - MIME type of the file
   * @param {Object} [options.metadata] - Custom metadata
   * @param {string} [options.acl] - Access control (e.g., 'public-read')
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, key, options = {}) {
    if (!this.s3Client) {
      throw new ApiError(500, 'Storage service not initialized');
    }

    try {
      let fileStream = file;

      // If file is a path, create a read stream
      if (typeof file === 'string') {
        fileStream = FileUtils.createReadStream(file);
      }

      // If file is a buffer, convert to stream
      if (Buffer.isBuffer(file)) {
        fileStream = Readable.from(file);
      }

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileStream,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata || {}
      };

      if (options.acl) {
        uploadParams.ACL = options.acl;
      }

      // Use multipart upload for large files
      const parallelUploads3 = new Upload({
        client: this.s3Client,
        params: uploadParams,
        queueSize: 4, // Number of concurrent uploads
        partSize: 1024 * 1024 * 5, // 5MB parts
        leavePartsOnError: false
      });

      const result = await parallelUploads3.done();

      logger.info(`File uploaded successfully: ${key}`);

      return {
        key,
        url: this.getPublicUrl(key),
        etag: result.ETag,
        versionId: result.VersionId,
        metadata: result.Metadata
      };
    } catch (error) {
      logger.error(`Error uploading file ${key}:`, error);
      throw new ApiError(500, `Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Download a file from storage
   * @param {string} key - Object key (path) in the bucket
   * @param {string} [localPath] - Local path to save the file (optional)
   * @returns {Promise<Buffer|Readable>} File content as Buffer or Readable stream
   */
  async downloadFile(key, localPath) {
    if (!this.s3Client) {
      throw new ApiError(500, 'Storage service not initialized');
    }

    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      const { Body } = await this.s3Client.send(new GetObjectCommand(params));

      // If local path is provided, save the file
      if (localPath) {
        const writeStream = FileUtils.createWriteStream(localPath);
        await new Promise((resolve, reject) => {
          Body.pipe(writeStream)
            .on('error', reject)
            .on('finish', resolve);
        });
        return localPath;
      }

      // Return as buffer
      const chunks = [];
      for await (const chunk of Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        throw new ApiError(404, `File not found: ${key}`);
      }
      logger.error(`Error downloading file ${key}:`, error);
      throw new ApiError(500, `Failed to download file: ${error.message}`);
    }
  }

  /**
   * Delete a file from storage
   * @param {string} key - Object key (path) in the bucket
   * @returns {Promise<boolean>} True if successful
   */
  async deleteFile(key) {
    if (!this.s3Client) {
      throw new ApiError(500, 'Storage service not initialized');
    }

    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      await this.s3Client.send(new DeleteObjectCommand(params));
      logger.info(`File deleted successfully: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting file ${key}:`, error);
      throw new ApiError(500, `Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for private files
   * @param {string} key - Object key (path) in the bucket
   * @param {number} [expiresIn] - Expiration time in seconds
   * @returns {Promise<string>} Signed URL
   */
  async getSignedUrl(key, expiresIn = this.signedUrlExpiry) {
    if (!this.s3Client) {
      throw new ApiError(500, 'Storage service not initialized');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      logger.error(`Error generating signed URL for ${key}:`, error);
      throw new ApiError(500, `Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Get public URL for a file (if bucket is public)
   * @param {string} key - Object key (path) in the bucket
   * @returns {string} Public URL
   */
  getPublicUrl(key) {
    if (!this.bucketName) {
      throw new ApiError(500, 'Bucket name not configured');
    }

    if (this.endpoint) {
      // For S3-compatible services with custom endpoint
      return `${this.endpoint.replace(/\/$/, '')}/${this.bucketName}/${key}`;
    }

    // For AWS S3
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * List files in a prefix/folder
   * @param {string} [prefix] - Prefix/folder path
   * @param {number} [maxKeys=1000] - Maximum number of keys to return
   * @returns {Promise<Array>} List of objects
   */
  async listFiles(prefix = '', maxKeys = 1000) {
    if (!this.s3Client) {
      throw new ApiError(500, 'Storage service not initialized');
    }

    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      const command = new ListObjectsV2Command(params);
      const response = await this.s3Client.send(command);

      return response.Contents || [];
    } catch (error) {
      logger.error(`Error listing files with prefix ${prefix}:`, error);
      throw new ApiError(500, `Failed to list files: ${error.message}`);
    }
  }

  /**
   * Copy a file to a new location
   * @param {string} sourceKey - Source object key
   * @param {string} destinationKey - Destination object key
   * @param {Object} [options] - Copy options
   * @returns {Promise<Object>} Copy result
   */
  async copyFile(sourceKey, destinationKey, options = {}) {
    if (!this.s3Client) {
      throw new ApiError(500, 'Storage service not initialized');
    }

    try {
      const copyParams = {
        Bucket: this.bucketName,
        CopySource: `/${this.bucketName}/${encodeURIComponent(sourceKey)}`,
        Key: destinationKey,
        MetadataDirective: 'COPY',
        ...options
      };

      const command = new CopyObjectCommand(copyParams);
      const result = await this.s3Client.send(command);

      logger.info(`File copied from ${sourceKey} to ${destinationKey}`);

      return {
        key: destinationKey,
        url: this.getPublicUrl(destinationKey),
        etag: result.ETag,
        versionId: result.VersionId
      };
    } catch (error) {
      logger.error(`Error copying file from ${sourceKey} to ${destinationKey}:`, error);
      throw new ApiError(500, `Failed to copy file: ${error.message}`);
    }
  }

  /**
   * Upload a file from a local path
   * @param {string} localPath - Path to local file
   * @param {string} key - Object key (path) in the bucket
   * @param {Object} [options] - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadFileFromPath(localPath, key, options = {}) {
    const fileStream = FileUtils.createReadStream(localPath);

    // Detect content type if not provided
    if (!options.contentType) {
      const mimeType = FileUtils.getMimeType(localPath);
      if (mimeType) {
        options.contentType = mimeType;
      }
    }

    return this.uploadFile(fileStream, key, options);
  }

  /**
   * Generate a pre-signed POST policy for direct browser uploads
   * @param {string} key - Object key (path) in the bucket
   * @param {Object} [options] - Upload options
   * @returns {Promise<Object>} Pre-signed POST data
   */
  async generatePresignedPost(key, options = {}) {
    // This is a simplified example. In a real implementation, you would use:
    // 1. @aws-sdk/s3-presigned-post for AWS S3
    // 2. The appropriate SDK for other storage providers

    const expiresIn = options.expiresIn || 3600; // 1 hour
    const contentType = options.contentType || 'application/octet-stream';
    const maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB

    // In a real implementation, you would generate the policy and signature here
    // and return the necessary fields for the client to use with a form upload

    return {
      url: this.getPublicUrl(''), // Base URL for uploads
      fields: {
        key,
        'Content-Type': contentType
        // Add other required fields based on your storage provider
      }
      // Add any additional data needed by the client
    };
  }
}

// Create and export a singleton instance
const storageService = new StorageService();

export default storageService;

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import stream from 'stream';
import crypto from 'crypto';
import mime from 'mime-types';
import { ApiError } from './apiError.js';

const pipeline = promisify(stream.pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileUtils {
  /**
   * Get the root directory of the project
   * @returns {string} Root directory path
   */
  static getRootDir() {
    return path.join(__dirname, '../..');
  }

  /**
   * Check if a file or directory exists
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>} True if the file/directory exists
   */
  static async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a file or directory exists synchronously
   * @param {string} filePath - Path to check
   * @returns {boolean} True if the file/directory exists
   */
  static existsSync(filePath) {
    return fsSync.existsSync(filePath);
  }

  /**
   * Create a directory if it doesn't exist
   * @param {string} dirPath - Directory path to create
   * @returns {Promise<string>} The created directory path
   */
  static async ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return dirPath;
    } catch (error) {
      throw new ApiError(500, `Failed to create directory: ${error.message}`);
    }
  }

  /**
   * Read a file
   * @param {string} filePath - Path to the file
   * @param {string} [encoding='utf8'] - File encoding
   * @returns {Promise<string|Buffer>} File content
   */
  static async readFile(filePath, encoding = 'utf8') {
    try {
      return await fs.readFile(filePath, { encoding });
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new ApiError(404, `File not found: ${filePath}`);
      }
      throw new ApiError(500, `Failed to read file: ${error.message}`);
    }
  }

  /**
   * Write data to a file
   * @param {string} filePath - Path to the file
   * @param {string|Buffer} data - Data to write
   * @param {string} [encoding='utf8'] - File encoding
   * @returns {Promise<void>}
   */
  static async writeFile(filePath, data, encoding = 'utf8') {
    try {
      await this.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, data, { encoding });
    } catch (error) {
      throw new ApiError(500, `Failed to write file: ${error.message}`);
    }
  }

  /**
   * Delete a file
   * @param {string} filePath - Path to the file
   * @returns {Promise<boolean>} True if the file was deleted, false if it didn't exist
   */
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw new ApiError(500, `Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file information
   * @param {string} filePath - Path to the file
   * @returns {Promise<fs.Stats>} File stats
   */
  static async getFileStats(filePath) {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new ApiError(404, `File not found: ${filePath}`);
      }
      throw new ApiError(500, `Failed to get file stats: ${error.message}`);
    }
  }

  /**
   * Get MIME type of a file
   * @param {string} filePath - Path to the file
   * @returns {string} MIME type
   */
  static getMimeType(filePath) {
    return mime.lookup(filePath) || 'application/octet-stream';
  }

  /**
   * Get file extension from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} File extension with dot (e.g., '.jpg')
   */
  static getExtensionFromMimeType(mimeType) {
    const ext = mime.extension(mimeType);
    return ext ? `.${ext}` : '';
  }

  /**
   * Generate a unique filename with extension
   * @param {string} originalName - Original filename
   * @param {string} [prefix=''] - Optional prefix
   * @returns {string} Unique filename
   */
  static generateUniqueFilename(originalName, prefix = '') {
    const ext = path.extname(originalName);
    const basename = path.basename(originalName, ext);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    return `${prefix}${basename}-${uniqueSuffix}${ext}`.toLowerCase();
  }

  /**
   * Calculate file hash (SHA-256)
   * @param {string} filePath - Path to the file
   * @returns {Promise<string>} File hash
   */
  static async calculateFileHash(filePath) {
    const hash = crypto.createHash('sha256');
    const stream = fsSync.createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error) => reject(new ApiError(500, `Failed to calculate file hash: ${error.message}`)));
    });
  }

  /**
   * Copy a file
   * @param {string} source - Source file path
   * @param {string} destination - Destination file path
   * @returns {Promise<void>}
   */
  static async copyFile(source, destination) {
    try {
      await this.ensureDir(path.dirname(destination));
      await fs.copyFile(source, destination);
    } catch (error) {
      throw new ApiError(500, `Failed to copy file: ${error.message}`);
    }
  }

  /**
   * Move a file
   * @param {string} source - Source file path
   * @param {string} destination - Destination file path
   * @returns {Promise<void>}
   */
  static async moveFile(source, destination) {
    try {
      await this.ensureDir(path.dirname(destination));
      await fs.rename(source, destination);
    } catch (error) {
      throw new ApiError(500, `Failed to move file: ${error.message}`);
    }
  }

  /**
   * List files in a directory
   * @param {string} dirPath - Directory path
   * @param {boolean} [recursive=false] - Whether to list files recursively
   * @returns {Promise<string[]>} Array of file paths
   */
  static async listFiles(dirPath, recursive = false) {
    try {
      const files = [];
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);

        if (item.isDirectory() && recursive) {
          const subFiles = await this.listFiles(fullPath, true);
          files.push(...subFiles);
        } else if (item.isFile()) {
          files.push(fullPath);
        }
      }

      return files;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new ApiError(404, `Directory not found: ${dirPath}`);
      }
      throw new ApiError(500, `Failed to list files: ${error.message}`);
    }
  }

  /**
   * Create a read stream for a file
   * @param {string} filePath - Path to the file
   * @returns {fs.ReadStream} Readable stream
   */
  static createReadStream(filePath) {
    if (!this.existsSync(filePath)) {
      throw new ApiError(404, `File not found: ${filePath}`);
    }
    return fsSync.createReadStream(filePath);
  }

  /**
   * Create a write stream for a file
   * @param {string} filePath - Path to the file
   * @returns {fs.WriteStream} Writable stream
   */
  static createWriteStream(filePath) {
    this.ensureDirSync(path.dirname(filePath));
    return fsSync.createWriteStream(filePath);
  }

  /**
   * Create a directory if it doesn't exist (synchronous)
   * @param {string} dirPath - Directory path to create
   * @returns {string} The created directory path
   */
  static ensureDirSync(dirPath) {
    if (!fsSync.existsSync(dirPath)) {
      fsSync.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
  }
}

export default FileUtils;

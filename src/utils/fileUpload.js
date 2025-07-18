import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import config from '../config/env.js';
import logger from './logger.js';
import { ApiError } from './apiError.js';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = getFileType(file.mimetype);
    const dest = path.join(uploadDir, fileType);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const fileTypes = {
    'image/jpeg': 'images',
    'image/png': 'images',
    'image/jpg': 'images',
    'image/gif': 'images',
    'image/webp': 'images',
    'application/pdf': 'documents',
    'application/msword': 'documents',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'documents',
    'application/vnd.ms-excel': 'documents',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'documents'
  };

  const fileType = file.mimetype;

  if (fileTypes[fileType]) {
    req.fileType = fileTypes[fileType];
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type'), false);
  }
};

// Get file type based on MIME type
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'images';
  if (mimetype.startsWith('video/')) return 'videos';
  if (mimetype.startsWith('audio/')) return 'audios';
  if (mimetype.startsWith('application/')) return 'documents';
  return 'others';
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware for single file upload
const uploadSingle = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File size is too large. Maximum size is 10MB'));
      }
      if (err.message === 'Invalid file type') {
        return next(new ApiError(400, 'Invalid file type. Only images, PDFs, and documents are allowed'));
      }
      return next(new ApiError(500, 'File upload failed'));
    }

    if (req.file) {
      // Generate public URL for the uploaded file
      const fileUrl = `${config.APP_URL}/uploads/${req.file.filename}`;
      req.file.publicUrl = fileUrl;

      // Add file info to request body
      req.body[fieldName] = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: fileUrl
      };
    }

    next();
  });
};

// Middleware for multiple file uploads
const uploadMultiple = (fieldName, maxCount = 5) => (req, res, next) => {
  upload.array(fieldName, maxCount)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'One or more files exceed the 10MB limit'));
      }
      if (err.message === 'Invalid file type') {
        return next(new ApiError(400, 'Invalid file type. Only images, PDFs, and documents are allowed'));
      }
      return next(new ApiError(500, 'File upload failed'));
    }

    if (req.files && req.files.length > 0) {
      // Process each file and generate public URLs
      const files = req.files.map((file) => {
        const fileUrl = `${config.APP_URL}/uploads/${file.filename}`;
        return {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: fileUrl
        };
      });

      // Add files to request body
      req.body[fieldName] = files;
    }

    next();
  });
};

// Delete file from the server
const deleteFile = (filePath) => {
  const fullPath = path.join(process.cwd(), filePath);

  return new Promise((resolve, reject) => {
    fs.unlink(fullPath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // File doesn't exist
          resolve(false);
        } else {
          logger.error(`Error deleting file ${filePath}:`, err);
          reject(err);
        }
      } else {
        logger.info(`File deleted: ${filePath}`);
        resolve(true);
      }
    });
  });
};

// Clean up temporary files in case of errors
const cleanupFiles = async(files) => {
  if (!files) return;

  const fileArray = Array.isArray(files) ? files : [files];

  for (const file of fileArray) {
    if (file && file.path) {
      try {
        await deleteFile(file.path);
      } catch (error) {
        logger.error('Error cleaning up file:', error);
      }
    }
  }
};

export {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  cleanupFiles,
  uploadDir
};
